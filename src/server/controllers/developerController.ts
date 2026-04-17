import type { Request, Response } from 'express';
import { prisma } from '../prismaClient';
import { z } from 'zod';

const replaceDeveloperSchema = z.object({
  volumeLiters: z.number().positive('Объём должен быть положительным'),
  concentrateName: z.string().optional(),
  concentrateRatio: z.string().optional(),
  maxAreaSqm: z.number().positive().optional(),
  notes: z.string().optional(),
});

async function calculateTotalAreaForBatch(batchId: string): Promise<number> {
  const orders = await prisma.order.findMany({
    where: { developerBatchId: batchId },
    select: { totalPlates: true, plateFormat: true },
  });

  const plateTypes = await prisma.plateType.findMany({
    where: { isActive: true },
    select: { format: true, areaSqm: true },
  });
  const areaMap = new Map(plateTypes.map(p => [p.format, p.areaSqm || 0]));

  return orders.reduce((sum, order) => {
    const areaPerPlate = areaMap.get(order.plateFormat) || 0;
    return sum + order.totalPlates * areaPerPlate;
  }, 0);
}

async function computeRasterDeviation(batchId: string) {
  const recentControls = await prisma.processControl.findMany({
    where: { developerBatchId: batchId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  let sum75 = 0, count75 = 0;
  let sum80 = 0, count80 = 0;

  recentControls.forEach(ctrl => {
    const measurements = ctrl.measurements as any[];
    measurements?.forEach(m => {
      if (m.target === 75 && typeof m.actual === 'number') {
        sum75 += m.target - m.actual;
        count75++;
      } else if (m.target === 80 && typeof m.actual === 'number') {
        sum80 += m.target - m.actual;
        count80++;
      }
    });
  });

  const avg75 = count75 > 0 ? sum75 / count75 : 0;
  const avg80 = count80 > 0 ? sum80 / count80 : 0;
  const status = (Math.abs(avg75) > 5 || Math.abs(avg80) > 5) ? 'warning' : 'normal';

  return { avg75, avg80, status };
}

export const developerController = {
  async getStatus(req: Request, res: Response) {
    try {
      const activeBatch = await prisma.developerBatch.findFirst({
        where: { isActive: true },
        orderBy: { startedAt: 'desc' },
      });

      if (!activeBatch) {
        return res.json({ success: true, data: null });
      }

      const totalArea = await calculateTotalAreaForBatch(activeBatch.id);
      const usagePercent = activeBatch.maxAreaSqm
        ? (totalArea / activeBatch.maxAreaSqm) * 100
        : null;

      const rasterDeviation = await computeRasterDeviation(activeBatch.id);

      res.json({
        success: true,
        data: {
          id: activeBatch.id,
          startedAt: activeBatch.startedAt,
          volumeLiters: activeBatch.volumeLiters,
          concentrateName: activeBatch.concentrateName,
          concentrateRatio: activeBatch.concentrateRatio,
          maxAreaSqm: activeBatch.maxAreaSqm,
          totalArea: Math.round(totalArea * 100) / 100,
          usagePercent: usagePercent !== null ? Math.round(usagePercent * 10) / 10 : null,
          rasterDeviation,
        },
      });
    } catch (error) {
      console.error('Error fetching developer status:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch developer status' });
    }
  },

  async replace(req: Request, res: Response) {
    try {
      const validated = replaceDeveloperSchema.parse(req.body);

      await prisma.developerBatch.updateMany({
        where: { isActive: true },
        data: { isActive: false, endedAt: new Date() },
      });

      const newBatch = await prisma.developerBatch.create({
        data: {
          volumeLiters: validated.volumeLiters,
          concentrateName: validated.concentrateName,
          concentrateRatio: validated.concentrateRatio,
          maxAreaSqm: validated.maxAreaSqm,
          notes: validated.notes,
          isActive: true,
        },
      });

      await prisma.eventLog.create({
        data: {
          eventType: 'developer.replaced',
          context: 'developer',
          payload: { batchId: newBatch.id, volumeLiters: newBatch.volumeLiters },
        },
      });

      res.status(201).json({ success: true, data: newBatch });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, error: 'Validation failed', details: error.errors });
      }
      console.error('Error replacing developer:', error);
      res.status(500).json({ success: false, error: 'Failed to replace developer' });
    }
  },

  async getHistory(req: Request, res: Response) {
    try {
      const batches = await prisma.developerBatch.findMany({
        orderBy: { startedAt: 'desc' },
        include: {
          _count: { select: { orders: true } },
        },
      });

      const batchesWithArea = await Promise.all(
        batches.map(async (batch) => {
          const totalArea = await calculateTotalAreaForBatch(batch.id);
          return {
            ...batch,
            totalArea: Math.round(totalArea * 100) / 100,
            orderCount: batch._count.orders,
          };
        })
      );

      res.json({ success: true, data: batchesWithArea });
    } catch (error) {
      console.error('Error fetching developer history:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch developer history' });
    }
  },
};
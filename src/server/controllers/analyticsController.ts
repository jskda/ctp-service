import type { Request, Response } from 'express';
import { prisma } from '../app';
import { Prisma } from '@prisma/client';

export const analyticsController = {
  // GET /api/analytics/process-controls?from=...&to=...&plateFormat=...
  async getProcessControls(req: Request, res: Response) {
    try {
      const { from, to, plateFormat } = req.query;
      
      const where: any = {};
      if (from || to) {
        where.createdAt = {};
        if (from) where.createdAt.gte = new Date(from as string);
        if (to) where.createdAt.lte = new Date(to as string);
      }
      
      if (plateFormat) {
        where.order = { plateFormat: plateFormat as string };
      }

      const controls = await prisma.processControl.findMany({
        where,
        include: {
          order: {
            select: {
              plateFormat: true,
              totalPlates: true,
              client: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ success: true, data: controls });
    } catch (error) {
      console.error('Error fetching process controls:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch process controls' });
    }
  },

  // GET /api/analytics/summary?from=...&to=...
  async getSummary(req: Request, res: Response) {
    try {
      const { from, to } = req.query;
      const dateFilter: any = {};
      if (from || to) {
        dateFilter.createdAt = {};
        if (from) dateFilter.createdAt.gte = new Date(from as string);
        if (to) dateFilter.createdAt.lte = new Date(to as string);
      }

      // Всего заказов за период
      const totalOrders = await prisma.order.count({ where: dateFilter });
      
      // Активные заказы (NEW/PROCESS) на конец периода
      const activeOrders = await prisma.order.count({
        where: {
          ...dateFilter,
          status: { in: ['NEW', 'PROCESS'] },
        },
      });

      // Всего израсходовано пластин (списание NORMAL_USAGE + SCRAP_*)
      const movements = await prisma.plateMovement.aggregate({
        where: {
          ...dateFilter,
          movementType: 'OUTGOING',
          reason: { in: ['NORMAL_USAGE', 'SCRAP_CLIENT', 'SCRAP_PRODUCTION', 'SCRAP_MATERIAL'] },
        },
        _sum: { quantity: true },
      });
      const totalUsedPlates = Math.abs(movements._sum.quantity || 0);

      // Брак по причинам
      const scrapStats = await prisma.plateMovement.groupBy({
        by: ['reason'],
        where: {
          ...dateFilter,
          reason: { in: ['SCRAP_CLIENT', 'SCRAP_PRODUCTION', 'SCRAP_MATERIAL'] },
        },
        _sum: { quantity: true },
      });

      // Последний контроль проявки
      const lastControl = await prisma.processControl.findFirst({
        where: dateFilter,
        orderBy: { createdAt: 'desc' },
        include: { order: { select: { plateFormat: true } } },
      });

      // Прогноз по отклонениям растра (упрощённо: среднее отклонение для 75% и 80%)
      const recentControls = await prisma.processControl.findMany({
        where: dateFilter,
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      let avgDeviation75 = 0;
      let avgDeviation80 = 0;
      let count75 = 0;
      let count80 = 0;

      recentControls.forEach(ctrl => {
        const measurements = ctrl.measurements as any[];
        measurements?.forEach(m => {
          if (m.target === 75) {
            avgDeviation75 += m.target - m.actual;
            count75++;
          } else if (m.target === 80) {
            avgDeviation80 += m.target - m.actual;
            count80++;
          }
        });
      });

      if (count75 > 0) avgDeviation75 /= count75;
      if (count80 > 0) avgDeviation80 /= count80;

      res.json({
        success: true,
        data: {
          totalOrders,
          activeOrders,
          totalUsedPlates,
          scrap: {
            CLIENT: scrapStats.find(s => s.reason === 'SCRAP_CLIENT')?._sum.quantity || 0,
            PRODUCTION: scrapStats.find(s => s.reason === 'SCRAP_PRODUCTION')?._sum.quantity || 0,
            MATERIALS: scrapStats.find(s => s.reason === 'SCRAP_MATERIAL')?._sum.quantity || 0,
          },
          lastControl,
          forecast: {
            avgDeviation75: Math.round(avgDeviation75 * 10) / 10,
            avgDeviation80: Math.round(avgDeviation80 * 10) / 10,
            status: (Math.abs(avgDeviation75) > 5 || Math.abs(avgDeviation80) > 5) ? 'warning' : 'normal',
          },
        },
      });
    } catch (error) {
      console.error('Error fetching summary:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch summary' });
    }
  },

  // GET /api/analytics/plate-formats
  async getPlateFormats(req: Request, res: Response) {
    try {
      const formats = await prisma.order.groupBy({
        by: ['plateFormat'],
        _count: { id: true },
      });
      res.json({ success: true, data: formats.map(f => f.plateFormat) });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch formats' });
    }
  },
};
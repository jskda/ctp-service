// src/server/controllers/orderController.ts
import type { Request, Response } from 'express';
import { prisma } from '../prismaClient';
import { createOrderSchema } from '../utils/validation';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

function generateOrderId(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${day}${month}${hours}${minutes}`;
}

async function createUniqueOrderId(): Promise<string> {
  let id = generateOrderId();
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      return id;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
    id = generateOrderId();
    attempts++;
  }

  throw new Error('Не удалось сгенерировать уникальный ID заказа после 10 попыток');
}

export const orderController = {
  async getAll(req: Request, res: Response) {
    try {
      const { status, clientId } = req.query;
      
      const where: any = {};
      if (status) where.status = status;
      if (clientId) where.clientId = clientId;

      const orders = await prisma.order.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              techNotes: true,
              isActive: true,
              archivedAt: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          plateMovements: {
            include: {
              plateType: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      
      res.json({
        success: true,
        data: orders,
        count: orders.length,
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch orders' });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const orderId = typeof id === 'string' ? id : id[0];

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              techNotes: true,
              isActive: true,
              archivedAt: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          plateMovements: {
            include: {
              plateType: true,
            },
          },
        },
      });

      if (!order) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }

      res.json({ success: true, data: order });
    } catch (error) {
      console.error('Error fetching order:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch order' });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const validatedData = createOrderSchema.parse(req.body);
      
      console.log('Creating order with data:', validatedData);
      
      const client = await prisma.client.findUnique({
        where: { id: validatedData.clientId },
      });
      
      if (!client) {
        return res.status(404).json({ success: false, error: 'Client not found' });
      }
      
      const plateType = await prisma.plateType.findFirst({
        where: { format: validatedData.plateFormat, isActive: true },
      });
      
      if (!plateType) {
        return res.status(400).json({ 
          success: false, 
          error: `Пластины формата ${validatedData.plateFormat} не найдены в системе` 
        });
      }
      
      const movementsBefore = await prisma.plateMovement.aggregate({
        where: { plateTypeId: plateType.id },
        _sum: { quantity: true },
      });
      
      const currentStockBefore = movementsBefore._sum.quantity || 0;
      console.log(`Before order: stock for ${plateType.format} = ${currentStockBefore}`);
      
      if (currentStockBefore < validatedData.totalPlates) {
        return res.status(400).json({ 
          success: false, 
          error: `Недостаточно пластин формата ${validatedData.plateFormat}. Доступно: ${currentStockBefore}, требуется: ${validatedData.totalPlates}` 
        });
      }
      
      const notesSnapshot: any = {};
      if (client.techNotes && Array.isArray(client.techNotes)) {
        notesSnapshot.clientTechNotes = client.techNotes;
      }
      
      // Находим активную партию проявителя
      const activeBatch = await prisma.developerBatch.findFirst({
        where: { isActive: true },
      });
      
      const orderId = await createUniqueOrderId();
      
      const order = await prisma.$transaction(async (tx) => {
        const newOrder = await tx.order.create({
          data: {
            id: orderId,
            clientId: validatedData.clientId,
            status: 'NEW',
            clientOrderNum: validatedData.clientOrderNum || null,
            plateFormat: validatedData.plateFormat,
            totalPlates: validatedData.totalPlates,
            notesSnapshot: Object.keys(notesSnapshot).length > 0 ? notesSnapshot : undefined,
            developerBatchId: activeBatch?.id,
          },
        });
        
        const movement = await tx.plateMovement.create({
          data: {
            plateTypeId: plateType.id,
            quantity: -validatedData.totalPlates,
            movementType: 'OUTGOING',
            reason: 'NORMAL_USAGE',
            orderId: newOrder.id,
            responsibility: 'PRODUCTION',
            writeOffCount: validatedData.totalPlates,
          },
        });
        
        console.log(`Created movement: quantity = ${movement.quantity} for order ${newOrder.id}`);
        
        return newOrder;
      });
      
      const movementsAfter = await prisma.plateMovement.aggregate({
        where: { plateTypeId: plateType.id },
        _sum: { quantity: true },
      });
      
      const currentStockAfter = movementsAfter._sum.quantity || 0;
      console.log(`After order: stock for ${plateType.format} = ${currentStockAfter}`);
      console.log(`Decreased by: ${currentStockBefore - currentStockAfter}`);
      
      await prisma.eventLog.create({
        data: {
          eventType: 'order.created',
          context: 'order',
          payload: {
            orderId: order.id,
            clientId: order.clientId,
            status: order.status,
            clientOrderNum: order.clientOrderNum,
            plateFormat: order.plateFormat,
            totalPlates: order.totalPlates,
            createdAt: order.createdAt,
            notesSnapshot: order.notesSnapshot,
          },
        },
      });
      
      res.status(201).json({ 
        success: true, 
        data: order,
        message: `Заказ создан. Списано ${validatedData.totalPlates} пластин формата ${validatedData.plateFormat}. Остаток: ${currentStockAfter} шт.`
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          success: false, 
          error: 'Validation failed', 
          details: error.errors 
        });
      }
      console.error('Error creating order:', error);
      res.status(500).json({ success: false, error: 'Failed to create order' });
    }
  },

  async startProcessing(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const orderId = typeof id === 'string' ? id : id[0];

      const currentOrder = await prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!currentOrder) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }

      if (currentOrder.status !== 'NEW') {
        return res.status(400).json({
          success: false,
          error: `Order must be in NEW status to start processing. Current status: ${currentOrder.status}`,
        });
      }

      await prisma.eventLog.create({
        data: {
          eventType: 'order.status.changed',
          context: 'order',
          payload: {
            orderId: orderId,
            oldStatus: currentOrder.status,
            newStatus: 'PROCESS',
            changedAt: new Date(),
          },
        },
      });

      const order = await prisma.order.update({
        where: { id: orderId },
        data: { status: 'PROCESS' },
      });

      res.json({ 
        success: true, 
        data: order,
        message: 'Заказ переведен в работу'
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }
      console.error('Error starting order processing:', error);
      res.status(500).json({ success: false, error: 'Failed to start order processing' });
    }
  },

  async complete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const orderId = typeof id === 'string' ? id : id[0];

      const currentOrder = await prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!currentOrder) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }

      if (currentOrder.status !== 'PROCESS') {
        return res.status(400).json({
          success: false,
          error: `Order must be in PROCESS status to complete. Current status: ${currentOrder.status}`,
        });
      }

      await prisma.eventLog.create({
        data: {
          eventType: 'order.status.changed',
          context: 'order',
          payload: {
            orderId: orderId,
            oldStatus: currentOrder.status,
            newStatus: 'DONE',
            changedAt: new Date(),
          },
        },
      });

      const order = await prisma.order.update({
        where: { id: orderId },
        data: { status: 'DONE' },
      });

      res.json({ 
        success: true, 
        data: order,
        message: 'Заказ завершен'
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }
      console.error('Error completing order:', error);
      res.status(500).json({ success: false, error: 'Failed to complete order' });
    }
  },

  async addProcessControl(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { measurements, speed, temperature, notes } = req.body;
      const orderId = typeof id === 'string' ? id : id[0];

      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }
      if (order.status !== 'PROCESS') {
        return res.status(400).json({
          success: false,
          error: 'Контрольные параметры можно вводить только для заказов в процессе',
        });
      }

      const activeBatch = await prisma.developerBatch.findFirst({
        where: { isActive: true },
      });

      const control = await prisma.processControl.create({
        data: {
          orderId,
          measurements: measurements || [],
          speed,
          temperature,
          notes,
          developerBatchId: activeBatch?.id,
        },
      });

      await prisma.eventLog.create({
        data: {
          eventType: 'process.control.added',
          context: 'order',
          payload: {
            orderId,
            controlId: control.id,
            measurements,
            speed,
            temperature,
          },
        },
      });

      res.status(201).json({ success: true, data: control });
    } catch (error: any) {
      console.error('Error adding process control:', error);
      res.status(500).json({ success: false, error: 'Failed to add process control' });
    }
  },

  async exportOrders(req: Request, res: Response) {
    try {
      const ExcelJS = await import('exceljs');
      const Workbook = ExcelJS.default.Workbook;
      const { month, year } = req.query;
      
      const now = new Date();
      const targetYear = year ? parseInt(year as string) : now.getFullYear();
      const targetMonth = month ? parseInt(month as string) - 1 : now.getMonth();
      
      const startDate = new Date(targetYear, targetMonth, 1);
      const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

      const orders = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          client: true,
          plateMovements: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      const workbook = new Workbook();
      const worksheet = workbook.addWorksheet(`Заказы ${format(startDate, 'LLLL yyyy', { locale: ru })}`);

      worksheet.columns = [
        { header: 'Дата', key: 'date', width: 14 },
        { header: 'Номер заказа', key: 'orderNumber', width: 14 },
        { header: 'Клиент', key: 'clientName', width: 35 },
        { header: 'Формат', key: 'plateFormat', width: 14 },
        { header: 'Количество', key: 'totalPlates', width: 16 },
        { header: 'Списания', key: 'scrapped', width: 16 },
      ];

      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: false };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

      orders.forEach(order => {
        const totalScrapped = order.plateMovements
          .filter(m => m.reason.startsWith('SCRAP_'))
          .reduce((sum, m) => sum + Math.abs(m.quantity), 0);

        worksheet.addRow({
          date: format(order.createdAt, 'dd.MM.yyyy'),
          orderNumber: `№${order.id}`,
          clientName: order.client?.name || '',
          plateFormat: order.plateFormat,
          totalPlates: order.totalPlates,
          scrapped: totalScrapped > 0 ? totalScrapped : '',
        });
      });

      const dataRows = worksheet.rowCount;
      for (let i = 2; i <= dataRows; i++) {
        worksheet.getRow(i).alignment = { horizontal: 'center', vertical: 'middle' };
      }

      const fileName = `orders_${targetYear}_${String(targetMonth + 1).padStart(2, '0')}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error('Error exporting orders:', error);
      res.status(500).json({ success: false, error: 'Failed to export orders' });
    }
  },
};
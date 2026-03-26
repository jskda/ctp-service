// src/server/controllers/orderController.ts
import type { Request, Response } from 'express';
import { prisma } from '../app';
import { createOrderSchema } from '../utils/validation';

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
      
      // НАХОДИМ ТИП ПЛАСТИНЫ ПО ФОРМАТУ
      const plateType = await prisma.plateType.findFirst({
        where: { format: validatedData.plateFormat, isActive: true },
      });
      
      if (!plateType) {
        return res.status(400).json({ 
          success: false, 
          error: `Пластины формата ${validatedData.plateFormat} не найдены в системе` 
        });
      }
      
      // ПРОВЕРЯЕМ ТЕКУЩИЙ ОСТАТОК ДО СПИСАНИЯ
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
      
      // СОЗДАЕМ ЗАКАЗ И СПИСЫВАЕМ ПЛАСТИНЫ В ТРАНЗАКЦИИ
      const order = await prisma.$transaction(async (tx) => {
        // Создаем заказ
        const newOrder = await tx.order.create({
          data: {
            clientId: validatedData.clientId,
            status: 'NEW',
            clientOrderNum: validatedData.clientOrderNum || null,
            plateFormat: validatedData.plateFormat,
            totalPlates: validatedData.totalPlates,
            notesSnapshot: Object.keys(notesSnapshot).length > 0 ? notesSnapshot : undefined,
          },
        });
        
        // Создаем движение списания (ОТРИЦАТЕЛЬНОЕ количество)
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
      
      // ПРОВЕРЯЕМ ОСТАТОК ПОСЛЕ СПИСАНИЯ
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
};
// src/server/controllers/orderController.ts
import type { Request, Response } from 'express';
import { prisma } from '../app';
import { createOrderSchema } from '../utils/validation';

export const orderController = {
  // GET /api/orders - список всех заказов
  async getAll(req: Request, res: Response) {
    try {
      const { status, clientId, colorMode } = req.query;
      
      const where: any = {};
      if (status) where.status = status;
      if (clientId) where.clientId = clientId;
      if (colorMode) where.colorMode = colorMode;

      const orders = await prisma.order.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              techNotes: true,
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

  // GET /api/orders/:id - получить заказ по ID
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const orderId = typeof id === 'string' ? id : id[0];

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          client: true,
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

  // POST /api/orders - ДЕЙСТВИЕ: Создать заказ (согласно спецификации)
  async create(req: Request, res: Response) {
    try {
      const validatedData = createOrderSchema.parse(req.body);
      
      // Проверяем существование клиента
      const client = await prisma.client.findUnique({
        where: { id: validatedData.clientId },
      });

      if (!client) {
        return res.status(404).json({ success: false, error: 'Client not found' });
      }

      // Создаем снапшот согласно спецификации (раздел 5.1.3)
      const notesSnapshot: any = {};
      
      // 1. Клиентские технологические настройки (раздел 5)
      if (client.techNotes && Array.isArray(client.techNotes)) {
        notesSnapshot.clientTechNotes = client.techNotes;
      }

      // 2. Автоматические контрольные пометки по красочности (раздел 3.5)
      const automatedNotes: string[] = [];
      
      // MULTICOLOR - обязательная контрольная пометка (раздел 3.5)
      if (validatedData.colorMode === 'MULTICOLOR') {
        automatedNotes.push('Overprint control');
      }
      
      // BLACK - условная пометка для определенных клиентов (раздел 5.4)
      // В реальной системе это будет проверяться по конкретному клиенту
      if (validatedData.colorMode === 'BLACK' && client.id === 'SPECIAL_CLIENT_ID') {
        automatedNotes.push('Необходимо компенсировать растискивание (проверить параметры RIP)');
      }
      
      if (automatedNotes.length > 0) {
        notesSnapshot.automatedNotes = automatedNotes;
      }

      // Создаем заказ со снапшотом
      const order = await prisma.order.create({
        data: {
          clientId: validatedData.clientId,
          colorMode: validatedData.colorMode,
          status: 'NEW', // Автоматически согласно спецификации 3.2
          notesSnapshot: Object.keys(notesSnapshot).length > 0 ? notesSnapshot : undefined,
        },
      });

      // Логируем событие согласно спецификации (раздел 3.6)
      await prisma.eventLog.create({
        data: {
          eventType: 'order.created',
          context: 'order',
          payload: {
            orderId: order.id,
            clientId: order.clientId,
            colorMode: order.colorMode,
            status: order.status,
            createdAt: order.createdAt,
            notesSnapshot: order.notesSnapshot,
          },
        },
      });

      res.status(201).json({ 
        success: true, 
        data: order,
        message: 'Заказ создан с применением контрольных пометок согласно спецификации'
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

  // POST /api/orders/:id/start-processing - ДЕЙСТВИЕ: Перевести заказ в работу
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

      // Проверяем статус: только из NEW можно перейти в PROCESS (раздел 3.2)
      if (currentOrder.status !== 'NEW') {
        return res.status(400).json({
          success: false,
          error: `Order must be in NEW status to start processing. Current status: ${currentOrder.status}`,
        });
      }

      // Логируем событие изменения статуса
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
        message: 'Заказ переведен в работу. Проверьте контрольные пометки.'
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }
      console.error('Error starting order processing:', error);
      res.status(500).json({ success: false, error: 'Failed to start order processing' });
    }
  },

  // POST /api/orders/:id/complete - ДЕЙСТВИЕ: Завершить заказ
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
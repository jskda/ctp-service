import { Request, Response } from 'express';
import { prisma } from '../app';
import { createOrderSchema, updateOrderSchema } from '../utils/validation';

export const orderController = {
  // GET /api/orders
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

  // GET /api/orders/:id
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const order = await prisma.order.findUnique({
        where: { id },
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

  // POST /api/orders
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

      // Создаем снапшот настроек клиента
      const notesSnapshot = validatedData.notesSnapshot || client.techNotes || {};

      const order = await prisma.order.create({
        data: {
          clientId: validatedData.clientId,
          colorMode: validatedData.colorMode,
          notesSnapshot,
        },
      });

      // Логируем событие
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

      res.status(201).json({ success: true, data: order });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, error: 'Validation failed', details: error.errors });
      }
      console.error('Error creating order:', error);
      res.status(500).json({ success: false, error: 'Failed to create order' });
    }
  },

  // PUT /api/orders/:id
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = updateOrderSchema.parse(req.body);
      
      // Получаем текущий заказ
      const currentOrder = await prisma.order.findUnique({
        where: { id },
      });

      if (!currentOrder) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }

      // Если меняется статус, логируем событие
      let eventLogData: any = null;
      if (validatedData.status && validatedData.status !== currentOrder.status) {
        eventLogData = {
          eventType: 'order.status.changed',
          context: 'order',
          payload: {
            orderId: id,
            oldStatus: currentOrder.status,
            newStatus: validatedData.status,
            changedAt: new Date(),
          },
        };
      }

      const order = await prisma.order.update({
        where: { id },
        data: validatedData,
      });

      // Создаем лог события, если статус изменился
      if (eventLogData) {
        await prisma.eventLog.create({ data: eventLogData });
      }

      res.json({ success: true, data: order });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, error: 'Validation failed', details: error.errors });
      }
      if (error.code === 'P2025') {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }
      console.error('Error updating order:', error);
      res.status(500).json({ success: false, error: 'Failed to update order' });
    }
  },

  // DELETE /api/orders/:id
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      await prisma.order.delete({
        where: { id },
      });

      // Логируем событие
      await prisma.eventLog.create({
        data: {
          eventType: 'order.deleted',
          context: 'order',
          payload: { orderId: id },
        },
      });

      res.json({ success: true, message: 'Order deleted successfully' });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }
      console.error('Error deleting order:', error);
      res.status(500).json({ success: false, error: 'Failed to delete order' });
    }
  },
};
// src/server/controllers/clientController.ts
import type { Request, Response } from 'express';
import { prisma } from '../app';
import { createClientSchema } from '../utils/validation';

export const clientController = {
  // GET /api/clients - список всех клиентов
  async getAll(req: Request, res: Response) {
    try {
      const clients = await prisma.client.findMany({
        include: {
          orders: {
            select: {
              id: true,
              status: true,
              colorMode: true,
              clientOrderNum: true,
              plateFormat: true,
              totalPlates: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      
      res.json({
        success: true,
        data: clients,
        count: clients.length,
      });
    } catch (error) {
      console.error('Error fetching clients:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch clients' });
    }
  },

  // GET /api/clients/:id - получить клиента по ID
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const clientId = typeof id === 'string' ? id : id[0];

      const client = await prisma.client.findUnique({
        where: { id: clientId },
        include: {
          orders: {
            include: {
              plateMovements: {
                include: {
                  plateType: true,
                },
              },
            },
          },
        },
      });

      if (!client) {
        return res.status(404).json({ success: false, error: 'Client not found' });
      }

      res.json({ success: true, data: client });
    } catch (error) {
      console.error('Error fetching client:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch client' });
    }
  },

  // GET /api/clients/active - только активные для выбора
  async getActive(req: Request, res: Response) {
    try {
      const clients = await prisma.client.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });
      res.json({ success: true, data: clients });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch active clients' });
    }
  },

  // POST /api/clients - создание клиента
  async create(req: Request, res: Response) {
    try {
      const { name, internalCode, techNotes } = createClientSchema.parse(req.body);
      const client = await prisma.client.create({
        data: { 
          name, 
          internalCode: internalCode || null,
          techNotes: techNotes || [] 
        },
      });
      await prisma.eventLog.create({
        data: {
          eventType: 'client.created',
          context: 'system',
          payload: { clientId: client.id, name: client.name, internalCode: client.internalCode },
        },
      });
      res.status(201).json({ success: true, data: client });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, error: 'Validation failed', details: error.errors });
      }
      res.status(500).json({ success: false, error: 'Failed to create client' });
    }
  },

  // DELETE /api/clients/:id - мягкое удаление (архивация)
  async archive(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const clientId = typeof id === 'string' ? id : id[0];

      // Проверяем, есть ли незавершённые заказы
      const activeOrders = await prisma.order.count({
        where: {
          clientId,
          status: { in: ['NEW', 'PROCESS'] },
        },
      });

      if (activeOrders > 0) {
        return res.status(400).json({
          success: false,
          error: `Cannot archive client with ${activeOrders} active order(s)`,
        });
      }

      const client = await prisma.client.update({
        where: { id: clientId },
        data: { isActive: false, archivedAt: new Date() },
      });

      await prisma.eventLog.create({
        data: {
          eventType: 'client.archived',
          context: 'system',
          payload: { clientId: client.id, name: client.name },
        },
      });

      res.json({ success: true, data: client });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ success: false, error: 'Client not found' });
      }
      res.status(500).json({ success: false, error: 'Failed to archive client' });
    }
  },

  // PUT /api/clients/:id - обновление клиента
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const clientId = typeof id === 'string' ? id : id[0];
      
      const validatedData = createClientSchema.partial().parse(req.body);
      
      const client = await prisma.client.update({
        where: { id: clientId },
        data: validatedData,
      });
      
      // Логируем событие
      await prisma.eventLog.create({
        data: {
          eventType: 'client.updated',
          context: 'system',
          payload: { 
            clientId: client.id, 
            updatedFields: Object.keys(validatedData),
            timestamp: new Date(),
          },
        },
      });
      
      res.json({ success: true, data: client });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, error: 'Validation failed', details: error.errors });
      }
      if (error.code === 'P2025') {
        return res.status(404).json({ success: false, error: 'Client not found' });
      }
      console.error('Error updating client:', error);
      res.status(500).json({ success: false, error: 'Failed to update client' });
    }
  },
};
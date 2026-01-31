import { Request, Response } from 'express';
import { prisma } from '../app';
import { createClientSchema, updateClientSchema } from '../utils/validation';

export const clientController = {
  // GET /api/clients
  async getAll(req: Request, res: Response) {
    try {
      const clients = await prisma.client.findMany({
        include: {
          orders: {
            select: {
              id: true,
              status: true,
              colorMode: true,
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

  // GET /api/clients/:id
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const client = await prisma.client.findUnique({
        where: { id },
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

  // POST /api/clients
  async create(req: Request, res: Response) {
    try {
      const validatedData = createClientSchema.parse(req.body);
      
      const client = await prisma.client.create({
        data: validatedData,
      });

      // Логируем событие
      await prisma.eventLog.create({
        data: {
          eventType: 'client.created',
          context: 'system',
          payload: { clientId: client.id, name: client.name },
        },
      });

      res.status(201).json({ success: true, data: client });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, error: 'Validation failed', details: error.errors });
      }
      console.error('Error creating client:', error);
      res.status(500).json({ success: false, error: 'Failed to create client' });
    }
  },

  // PUT /api/clients/:id
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = updateClientSchema.parse(req.body);
      
      const client = await prisma.client.update({
        where: { id },
        data: validatedData,
      });

      // Логируем событие
      await prisma.eventLog.create({
        data: {
          eventType: 'client.updated',
          context: 'system',
          payload: { clientId: client.id, changes: validatedData },
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

  // DELETE /api/clients/:id
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Проверяем наличие заказов
      const orderCount = await prisma.order.count({
        where: { clientId: id },
      });

      if (orderCount > 0) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete client with existing orders',
        });
      }

      await prisma.client.delete({
        where: { id },
      });

      // Логируем событие
      await prisma.eventLog.create({
        data: {
          eventType: 'client.deleted',
          context: 'system',
          payload: { clientId: id },
        },
      });

      res.json({ success: true, message: 'Client deleted successfully' });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ success: false, error: 'Client not found' });
      }
      console.error('Error deleting client:', error);
      res.status(500).json({ success: false, error: 'Failed to delete client' });
    }
  },
};
import type { Request, Response } from 'express';
import { prisma } from '../app';
import { createClientSchema, updateClientTechNotesSchema } from '../utils/validation';

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
      
      // Исправление: гарантируем, что id — строка
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

  // POST /api/clients - ДЕЙСТВИЕ: Создать клиента
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

  // PUT /api/clients/:id/tech-notes - ДЕЙСТВИЕ: Изменить клиентские настройки
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
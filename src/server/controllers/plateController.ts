import { Request, Response } from 'express';
import { prisma } from '../app';
import {
  createPlateTypeSchema,
  updatePlateTypeSchema,
  createPlateMovementSchema,
} from '../utils/validation';

export const plateController = {
  // --- PlateType operations ---

  // GET /api/plates/types
  async getAllTypes(req: Request, res: Response) {
    try {
      const plateTypes = await prisma.plateType.findMany({
        include: {
          movements: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      
      // Вычисляем остатки для каждого типа
      const plateTypesWithStock = await Promise.all(
        plateTypes.map(async (plateType) => {
          const stock = await prisma.plateMovement.groupBy({
            by: ['plateTypeId'],
            where: { plateTypeId: plateType.id },
            _sum: { quantity: true },
          });

          const totalQuantity = stock[0]?._sum.quantity || 0;
          const isDeficit = totalQuantity < plateType.minStockThreshold;

          return {
            ...plateType,
            currentStock: totalQuantity,
            isDeficit,
          };
        })
      );

      res.json({
        success: true,
        data: plateTypesWithStock,
        count: plateTypesWithStock.length,
      });
    } catch (error) {
      console.error('Error fetching plate types:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch plate types' });
    }
  },

  // GET /api/plates/types/:id
  async getTypeById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const plateType = await prisma.plateType.findUnique({
        where: { id },
        include: {
          movements: {
            include: {
              order: {
                select: {
                  id: true,
                  status: true,
                  colorMode: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!plateType) {
        return res.status(404).json({ success: false, error: 'Plate type not found' });
      }

      // Вычисляем остаток
      const stock = await prisma.plateMovement.groupBy({
        by: ['plateTypeId'],
        where: { plateTypeId: id },
        _sum: { quantity: true },
      });

      const totalQuantity = stock[0]?._sum.quantity || 0;
      const isDeficit = totalQuantity < plateType.minStockThreshold;

      res.json({
        success: true,
        data: {
          ...plateType,
          currentStock: totalQuantity,
          isDeficit,
        },
      });
    } catch (error) {
      console.error('Error fetching plate type:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch plate type' });
    }
  },

  // POST /api/plates/types
  async createType(req: Request, res: Response) {
    try {
      const validatedData = createPlateTypeSchema.parse(req.body);
      
      const plateType = await prisma.plateType.create({
        data: validatedData,
      });

      // Логируем событие
      await prisma.eventLog.create({
        data: {
          eventType: 'plate.type.created',
          context: 'stock',
          payload: { plateTypeId: plateType.id, format: plateType.format },
        },
      });

      res.status(201).json({ success: true, data: plateType });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, error: 'Validation failed', details: error.errors });
      }
      console.error('Error creating plate type:', error);
      res.status(500).json({ success: false, error: 'Failed to create plate type' });
    }
  },

  // PUT /api/plates/types/:id
  async updateType(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = updatePlateTypeSchema.parse(req.body);
      
      const plateType = await prisma.plateType.update({
        where: { id },
        data: validatedData,
      });

      // Логируем событие
      await prisma.eventLog.create({
        data: {
          eventType: 'plate.type.updated',
          context: 'stock',
          payload: { plateTypeId: id, changes: validatedData },
        },
      });

      res.json({ success: true, data: plateType });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, error: 'Validation failed', details: error.errors });
      }
      if (error.code === 'P2025') {
        return res.status(404).json({ success: false, error: 'Plate type not found' });
      }
      console.error('Error updating plate type:', error);
      res.status(500).json({ success: false, error: 'Failed to update plate type' });
    }
  },

  // DELETE /api/plates/types/:id
  async deleteType(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Проверяем наличие движений
      const movementCount = await prisma.plateMovement.count({
        where: { plateTypeId: id },
      });

      if (movementCount > 0) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete plate type with existing movements',
        });
      }

      await prisma.plateType.delete({
        where: { id },
      });

      // Логируем событие
      await prisma.eventLog.create({
        data: {
          eventType: 'plate.type.deleted',
          context: 'stock',
          payload: { plateTypeId: id },
        },
      });

      res.json({ success: true, message: 'Plate type deleted successfully' });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ success: false, error: 'Plate type not found' });
      }
      console.error('Error deleting plate type:', error);
      res.status(500).json({ success: false, error: 'Failed to delete plate type' });
    }
  },

  // --- PlateMovement operations ---

  // POST /api/plates/movements
  async createMovement(req: Request, res: Response) {
    try {
      const validatedData = createPlateMovementSchema.parse(req.body);
      
      // Проверяем существование типа пластины
      const plateType = await prisma.plateType.findUnique({
        where: { id: validatedData.plateTypeId },
      });

      if (!plateType) {
        return res.status(404).json({ success: false, error: 'Plate type not found' });
      }

      // Если указан заказ, проверяем его существование и статус
      if (validatedData.orderId) {
        const order = await prisma.order.findUnique({
          where: { id: validatedData.orderId },
        });

        if (!order) {
          return res.status(404).json({ success: false, error: 'Order not found' });
        }

        // Для списания (outgoing) заказ должен быть в статусе PROCESS
        if (
          validatedData.movementType === 'OUTGOING' &&
          validatedData.reason === 'NORMAL_USAGE' &&
          order.status !== 'PROCESS'
        ) {
          return res.status(400).json({
            success: false,
            error: 'Order must be in PROCESS status for normal usage',
          });
        }
      }

      // Создаем движение
      const movement = await prisma.plateMovement.create({
        data: validatedData,
      });

      // Логируем событие
      await prisma.eventLog.create({
        data: {
          eventType: 'plate.movement',
          context: 'stock',
          payload: {
            plateTypeId: movement.plateTypeId,
            quantity: movement.quantity,
            movementType: movement.movementType,
            reason: movement.reason,
            orderId: movement.orderId,
            responsibility: movement.responsibility,
            timestamp: movement.createdAt,
          },
        },
      });

      // Проверяем дефицит после движения
      const stock = await prisma.plateMovement.groupBy({
        by: ['plateTypeId'],
        where: { plateTypeId: validatedData.plateTypeId },
        _sum: { quantity: true },
      });

      const totalQuantity = stock[0]?._sum.quantity || 0;
      const isDeficit = totalQuantity < plateType.minStockThreshold;

      if (isDeficit) {
        await prisma.eventLog.create({
          data: {
            eventType: 'plate.deficit.alert',
            context: 'stock',
            payload: {
              plateTypeId: validatedData.plateTypeId,
              currentStock: totalQuantity,
              threshold: plateType.minStockThreshold,
              timestamp: new Date(),
            },
          },
        });
      }

      res.status(201).json({
        success: true,
        data: movement,
        stockInfo: {
          currentStock: totalQuantity,
          isDeficit,
        },
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, error: 'Validation failed', details: error.errors });
      }
      console.error('Error creating plate movement:', error);
      res.status(500).json({ success: false, error: 'Failed to create plate movement' });
    }
  },

  // GET /api/plates/movements
  async getMovements(req: Request, res: Response) {
    try {
      const { plateTypeId, orderId, movementType, reason } = req.query;
      
      const where: any = {};
      if (plateTypeId) where.plateTypeId = plateTypeId as string;
      if (orderId) where.orderId = orderId as string;
      if (movementType) where.movementType = movementType;
      if (reason) where.reason = reason;

      const movements = await prisma.plateMovement.findMany({
        where,
        include: {
          plateType: true,
          order: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      
      res.json({
        success: true,
        data: movements,
        count: movements.length,
      });
    } catch (error) {
      console.error('Error fetching plate movements:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch plate movements' });
    }
  },

  // GET /api/plates/stock
  async getStock(req: Request, res: Response) {
    try {
      // Группируем движения по типам пластин
      const stockData = await prisma.plateMovement.groupBy({
        by: ['plateTypeId'],
        _sum: { quantity: true },
      });

      // Получаем информацию о типах пластин
      const plateTypeIds = stockData.map((item) => item.plateTypeId);
      const plateTypes = await prisma.plateType.findMany({
        where: {
          id: { in: plateTypeIds },
        },
      });

      // Формируем результат с информацией о дефиците
      const stockWithDetails = await Promise.all(
        stockData.map(async (item) => {
          const plateType = plateTypes.find((pt) => pt.id === item.plateTypeId);
          if (!plateType) return null;

          const totalQuantity = item._sum.quantity || 0;
          const isDeficit = totalQuantity < plateType.minStockThreshold;

          return {
            plateTypeId: item.plateTypeId,
            format: plateType.format,
            manufacturer: plateType.manufacturer,
            currentStock: totalQuantity,
            minStockThreshold: plateType.minStockThreshold,
            isDeficit,
          };
        })
      );

      res.json({
        success: true,
        data: stockWithDetails.filter(Boolean),
      });
    } catch (error) {
      console.error('Error fetching stock:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch stock' });
    }
  },
};
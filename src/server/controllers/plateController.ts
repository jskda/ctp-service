import type { Request, Response } from 'express';
import { prisma } from '../app';
import {
  createPlateTypeSchema,
  updatePlateTypeThresholdSchema,
  recordPurchaseSchema,
  recordReturnSchema,
  recordCorrectionSchema,
  recordUsageSchema,
  recordScrapClientSchema,
  recordScrapProductionSchema,
  recordScrapMaterialSchema,
  recordLossTestSchema,
  recordLossCalibrationSchema,
  recordLossEquipmentSchema,
} from '../utils/validation';

export const plateController = {
  // --- PlateType operations ---

  // GET /api/plates/types - список всех типов пластин
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

  // GET /api/plates/types/:id - получить тип пластины по ID
  async getTypeById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Исправление: гарантируем, что id — строка
      const plateTypeId = typeof id === 'string' ? id : id[0];

      const plateType = await prisma.plateType.findUnique({
        where: { id: plateTypeId },
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
        where: { plateTypeId },
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

  // POST /api/plates/types - ДЕЙСТВИЕ: Создать тип пластины
  async createType(req: Request, res: Response) {
    try {
      const validatedData = createPlateTypeSchema.parse(req.body);
      
      // Преобразуем otherParams в правильный тип для Prisma (Json)
      const dataToCreate = {
        format: validatedData.format,
        manufacturer: validatedData.manufacturer,
        otherParams: validatedData.otherParams ?? {},
        minStockThreshold: validatedData.minStockThreshold,
      };

      const plateType = await prisma.plateType.create({
        data: dataToCreate,
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

  // PUT /api/plates/types/:id - ДЕЙСТВИЕ: Обновить тип пластины
  async updateType(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const plateTypeId = typeof id === 'string' ? id : id[0];
      const validatedData = createPlateTypeSchema.partial().parse(req.body);
      
      // Убираем undefined значения
      const dataToUpdate: any = {};
      if (validatedData.format !== undefined) dataToUpdate.format = validatedData.format;
      if (validatedData.manufacturer !== undefined) dataToUpdate.manufacturer = validatedData.manufacturer;
      if (validatedData.otherParams !== undefined) dataToUpdate.otherParams = validatedData.otherParams;
      
      const plateType = await prisma.plateType.update({
        where: { id: plateTypeId },
        data: dataToUpdate,
      });
      
      // Логируем событие
      await prisma.eventLog.create({
        data: {
          eventType: 'plate.type.updated',
          context: 'stock',
          payload: { 
            plateTypeId: plateType.id, 
            updatedFields: Object.keys(dataToUpdate),
          },
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

  // PUT /api/plates/types/:id/threshold - ДЕЙСТВИЕ: Задать минимальный остаток
  async updateThreshold(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const plateTypeId = typeof id === 'string' ? id : id[0];
      const validatedData = updatePlateTypeThresholdSchema.parse(req.body);
      
      const plateType = await prisma.plateType.update({
        where: { id: plateTypeId },
        data: { minStockThreshold: validatedData.minStockThreshold },
      });

      // Логируем событие
      await prisma.eventLog.create({
        data: {
          eventType: 'plate.threshold.updated',
          context: 'stock',
          payload: {
            plateTypeId: plateTypeId,
            newThreshold: validatedData.minStockThreshold,
          },
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
      console.error('Error updating plate threshold:', error);
      res.status(500).json({ success: false, error: 'Failed to update plate threshold' });
    }
  },

  // --- PlateMovement operations - Поступление ---

  // POST /api/plates/movements/purchase - ДЕЙСТВИЕ: Зафиксировать закупку пластин
  async recordPurchase(req: Request, res: Response) {
    try {
      const validatedData = recordPurchaseSchema.parse(req.body);
      
      // Проверяем существование типа пластины
      const plateType = await prisma.plateType.findUnique({
        where: { id: validatedData.plateTypeId },
      });

      if (!plateType) {
        return res.status(404).json({ success: false, error: 'Plate type not found' });
      }

      // Создаем движение
      const movement = await prisma.plateMovement.create({
        data: {
          plateTypeId: validatedData.plateTypeId,
          quantity: validatedData.quantity,
          movementType: 'INCOMING',
          reason: 'PURCHASE',
        },
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
            timestamp: movement.createdAt,
          },
        },
      });

      // Проверяем дефицит после движения
      await checkAndLogDeficit(validatedData.plateTypeId, plateType.minStockThreshold);

      res.status(201).json({
        success: true,
        data: movement,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, error: 'Validation failed', details: error.errors });
      }
      console.error('Error recording purchase:', error);
      res.status(500).json({ success: false, error: 'Failed to record purchase' });
    }
  },

  // POST /api/plates/movements/return - ДЕЙСТВИЕ: Зафиксировать возврат пластин
  async recordReturn(req: Request, res: Response) {
    try {
      const validatedData = recordReturnSchema.parse(req.body);
      
      const plateType = await prisma.plateType.findUnique({
        where: { id: validatedData.plateTypeId },
      });

      if (!plateType) {
        return res.status(404).json({ success: false, error: 'Plate type not found' });
      }

      const movement = await prisma.plateMovement.create({
        data: {
          plateTypeId: validatedData.plateTypeId,
          quantity: validatedData.quantity,
          movementType: 'INCOMING',
          reason: 'RETURN',
        },
      });

      await prisma.eventLog.create({
        data: {
          eventType: 'plate.movement',
          context: 'stock',
          payload: {
            plateTypeId: movement.plateTypeId,
            quantity: movement.quantity,
            movementType: movement.movementType,
            reason: movement.reason,
            timestamp: movement.createdAt,
          },
        },
      });

      await checkAndLogDeficit(validatedData.plateTypeId, plateType.minStockThreshold);

      res.status(201).json({ success: true, data: movement });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, error: 'Validation failed', details: error.errors });
      }
      console.error('Error recording return:', error);
      res.status(500).json({ success: false, error: 'Failed to record return' });
    }
  },

  // POST /api/plates/movements/correction - ДЕЙСТВИЕ: Корректировка прихода
  async recordCorrection(req: Request, res: Response) {
    try {
      const validatedData = recordCorrectionSchema.parse(req.body);
      
      const plateType = await prisma.plateType.findUnique({
        where: { id: validatedData.plateTypeId },
      });

      if (!plateType) {
        return res.status(404).json({ success: false, error: 'Plate type not found' });
      }

      const movementType = validatedData.quantity > 0 ? 'INCOMING' : 'OUTGOING';

      const movement = await prisma.plateMovement.create({
        data: {
          plateTypeId: validatedData.plateTypeId,
          quantity: validatedData.quantity,
          movementType,
          reason: 'CORRECTION',
        },
      });

      await prisma.eventLog.create({
        data: {
          eventType: 'plate.movement',
          context: 'stock',
          payload: {
            plateTypeId: movement.plateTypeId,
            quantity: movement.quantity,
            movementType: movement.movementType,
            reason: movement.reason,
            timestamp: movement.createdAt,
          },
        },
      });

      await checkAndLogDeficit(validatedData.plateTypeId, plateType.minStockThreshold);

      res.status(201).json({ success: true, data: movement });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, error: 'Validation failed', details: error.errors });
      }
      console.error('Error recording correction:', error);
      res.status(500).json({ success: false, error: 'Failed to record correction' });
    }
  },

  // --- PlateMovement operations - Использование по заказу ---

  // POST /api/plates/movements/usage - ДЕЙСТВИЕ: Списать пластины по заказу
  async recordUsage(req: Request, res: Response) {
    try {
      const validatedData = recordUsageSchema.parse(req.body);
      
      // Проверяем существование типа пластины
      const plateType = await prisma.plateType.findUnique({
        where: { id: validatedData.plateTypeId },
      });

      if (!plateType) {
        return res.status(404).json({ success: false, error: 'Plate type not found' });
      }

      // Проверяем существование заказа и его статус
      const order = await prisma.order.findUnique({
        where: { id: validatedData.orderId },
      });

      if (!order) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }

      // Проверяем статус заказа: только PROCESS
      if (order.status !== 'PROCESS') {
        return res.status(400).json({
          success: false,
          error: `Order must be in PROCESS status for plate usage. Current status: ${order.status}`,
        });
      }

      // Создаем движение (отрицательное количество для списания)
      const movement = await prisma.plateMovement.create({
        data: {
          plateTypeId: validatedData.plateTypeId,
          quantity: -validatedData.quantity,
          movementType: 'OUTGOING',
          reason: 'NORMAL_USAGE',
          orderId: validatedData.orderId,
          responsibility: 'PRODUCTION',
        },
      });

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

      await checkAndLogDeficit(validatedData.plateTypeId, plateType.minStockThreshold);

      res.status(201).json({
        success: true,
        data: movement,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, error: 'Validation failed', details: error.errors });
      }
      console.error('Error recording usage:', error);
      res.status(500).json({ success: false, error: 'Failed to record usage' });
    }
  },

  // --- PlateMovement operations - Брак ---

  // POST /api/plates/movements/scrap/client - ДЕЙСТВИЕ: Зафиксировать брак (клиент)
  async recordScrapClient(req: Request, res: Response) {
    try {
      const validatedData = recordScrapClientSchema.parse(req.body);
      
      const plateType = await prisma.plateType.findUnique({
        where: { id: validatedData.plateTypeId },
      });

      if (!plateType) {
        return res.status(404).json({ success: false, error: 'Plate type not found' });
      }

      const order = await prisma.order.findUnique({
        where: { id: validatedData.orderId },
      });

      if (!order) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }

      const movement = await prisma.plateMovement.create({
        data: {
          plateTypeId: validatedData.plateTypeId,
          quantity: -validatedData.quantity,
          movementType: 'OUTGOING',
          reason: 'SCRAP_CLIENT',
          orderId: validatedData.orderId,
          responsibility: 'CLIENT',
        },
      });

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
            description: validatedData.reason ?? '',
          },
        },
      });

      await checkAndLogDeficit(validatedData.plateTypeId, plateType.minStockThreshold);

      res.status(201).json({ success: true, data: movement });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, error: 'Validation failed', details: error.errors });
      }
      console.error('Error recording client scrap:', error);
      res.status(500).json({ success: false, error: 'Failed to record client scrap' });
    }
  },

  // POST /api/plates/movements/scrap/production - ДЕЙСТВИЕ: Зафиксировать брак (производство)
  async recordScrapProduction(req: Request, res: Response) {
    try {
      const validatedData = recordScrapProductionSchema.parse(req.body);
      
      const plateType = await prisma.plateType.findUnique({
        where: { id: validatedData.plateTypeId },
      });

      if (!plateType) {
        return res.status(404).json({ success: false, error: 'Plate type not found' });
      }

      const order = await prisma.order.findUnique({
        where: { id: validatedData.orderId },
      });

      if (!order) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }

      const movement = await prisma.plateMovement.create({
        data: {
          plateTypeId: validatedData.plateTypeId,
          quantity: -validatedData.quantity,
          movementType: 'OUTGOING',
          reason: 'SCRAP_PRODUCTION',
          orderId: validatedData.orderId,
          responsibility: 'PRODUCTION',
        },
      });

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
            description: validatedData.reason ?? '',
          },
        },
      });

      await checkAndLogDeficit(validatedData.plateTypeId, plateType.minStockThreshold);

      res.status(201).json({ success: true, data: movement });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, error: 'Validation failed', details: error.errors });
      }
      console.error('Error recording production scrap:', error);
      res.status(500).json({ success: false, error: 'Failed to record production scrap' });
    }
  },

  // POST /api/plates/movements/scrap/material - ДЕЙСТВИЕ: Зафиксировать брак (материалы)
  async recordScrapMaterial(req: Request, res: Response) {
    try {
      const validatedData = recordScrapMaterialSchema.parse(req.body);
      
      const plateType = await prisma.plateType.findUnique({
        where: { id: validatedData.plateTypeId },
      });

      if (!plateType) {
        return res.status(404).json({ success: false, error: 'Plate type not found' });
      }

      // orderId опционален для брака материалов
      if (validatedData.orderId) {
        const order = await prisma.order.findUnique({
          where: { id: validatedData.orderId },
        });

        if (!order) {
          return res.status(404).json({ success: false, error: 'Order not found' });
        }
      }

      const movement = await prisma.plateMovement.create({
        data: {
          plateTypeId: validatedData.plateTypeId,
          quantity: -validatedData.quantity,
          movementType: 'OUTGOING',
          reason: 'SCRAP_MATERIAL',
          orderId: validatedData.orderId || null,
          responsibility: 'MATERIALS',
        },
      });

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
            description: validatedData.reason ?? '',
          },
        },
      });

      await checkAndLogDeficit(validatedData.plateTypeId, plateType.minStockThreshold);

      res.status(201).json({ success: true, data: movement });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, error: 'Validation failed', details: error.errors });
      }
      console.error('Error recording material scrap:', error);
      res.status(500).json({ success: false, error: 'Failed to record material scrap' });
    }
  },

  // --- PlateMovement operations - Производственные потери ---

  // POST /api/plates/movements/loss/test - ДЕЙСТВИЕ: Зафиксировать тест
  async recordLossTest(req: Request, res: Response) {
    try {
      const validatedData = recordLossTestSchema.parse(req.body);
      
      const plateType = await prisma.plateType.findUnique({
        where: { id: validatedData.plateTypeId },
      });

      if (!plateType) {
        return res.status(404).json({ success: false, error: 'Plate type not found' });
      }

      const movement = await prisma.plateMovement.create({
        data: {
          plateTypeId: validatedData.plateTypeId,
          quantity: -validatedData.quantity,
          movementType: 'OUTGOING',
          reason: 'LOSS_TEST',
        },
      });

      await prisma.eventLog.create({
        data: {
          eventType: 'plate.movement',
          context: 'stock',
          payload: {
            plateTypeId: movement.plateTypeId,
            quantity: movement.quantity,
            movementType: movement.movementType,
            reason: movement.reason,
            timestamp: movement.createdAt,
          },
        },
      });

      await checkAndLogDeficit(validatedData.plateTypeId, plateType.minStockThreshold);

      res.status(201).json({ success: true, data: movement });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, error: 'Validation failed', details: error.errors });
      }
      console.error('Error recording test loss:', error);
      res.status(500).json({ success: false, error: 'Failed to record test loss' });
    }
  },

  // POST /api/plates/movements/loss/calibration - ДЕЙСТВИЕ: Зафиксировать калибровку
  async recordLossCalibration(req: Request, res: Response) {
    try {
      const validatedData = recordLossCalibrationSchema.parse(req.body);
      
      const plateType = await prisma.plateType.findUnique({
        where: { id: validatedData.plateTypeId },
      });

      if (!plateType) {
        return res.status(404).json({ success: false, error: 'Plate type not found' });
      }

      const movement = await prisma.plateMovement.create({
        data: {
          plateTypeId: validatedData.plateTypeId,
          quantity: -validatedData.quantity,
          movementType: 'OUTGOING',
          reason: 'LOSS_CALIBRATION',
        },
      });

      await prisma.eventLog.create({
        data: {
          eventType: 'plate.movement',
          context: 'stock',
          payload: {
            plateTypeId: movement.plateTypeId,
            quantity: movement.quantity,
            movementType: movement.movementType,
            reason: movement.reason,
            timestamp: movement.createdAt,
          },
        },
      });

      await checkAndLogDeficit(validatedData.plateTypeId, plateType.minStockThreshold);

      res.status(201).json({ success: true, data: movement });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, error: 'Validation failed', details: error.errors });
      }
      console.error('Error recording calibration loss:', error);
      res.status(500).json({ success: false, error: 'Failed to record calibration loss' });
    }
  },

  // POST /api/plates/movements/loss/equipment - ДЕЙСТВИЕ: Зафиксировать сбой оборудования
  async recordLossEquipment(req: Request, res: Response) {
    try {
      const validatedData = recordLossEquipmentSchema.parse(req.body);
      
      const plateType = await prisma.plateType.findUnique({
        where: { id: validatedData.plateTypeId },
      });

      if (!plateType) {
        return res.status(404).json({ success: false, error: 'Plate type not found' });
      }

      const movement = await prisma.plateMovement.create({
        data: {
          plateTypeId: validatedData.plateTypeId,
          quantity: -validatedData.quantity,
          movementType: 'OUTGOING',
          reason: 'LOSS_EQUIPMENT',
        },
      });

      await prisma.eventLog.create({
        data: {
          eventType: 'plate.movement',
          context: 'stock',
          payload: {
            plateTypeId: movement.plateTypeId,
            quantity: movement.quantity,
            movementType: movement.movementType,
            reason: movement.reason,
            timestamp: movement.createdAt,
            description: validatedData.description ?? '',
          },
        },
      });

      await checkAndLogDeficit(validatedData.plateTypeId, plateType.minStockThreshold);

      res.status(201).json({ success: true, data: movement });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, error: 'Validation failed', details: error.errors });
      }
      console.error('Error recording equipment loss:', error);
      res.status(500).json({ success: false, error: 'Failed to record equipment loss' });
    }
  },

  // GET /api/plates/stock - Текущие остатки
  async getStock(req: Request, res: Response) {
    try {
      const stockData = await prisma.plateMovement.groupBy({
        by: ['plateTypeId'],
        _sum: { quantity: true },
      });

      const plateTypeIds = stockData.map((item) => item.plateTypeId);
      const plateTypes = await prisma.plateType.findMany({
        where: {
          id: { in: plateTypeIds },
        },
      });

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

// Вспомогательная функция для проверки дефицита
async function checkAndLogDeficit(plateTypeId: string, threshold: number) {
  const stock = await prisma.plateMovement.groupBy({
    by: ['plateTypeId'],
    where: { plateTypeId },
    _sum: { quantity: true },
  });

  const totalQuantity = stock[0]?._sum.quantity || 0;
  const isDeficit = totalQuantity < threshold;

  if (isDeficit) {
    await prisma.eventLog.create({
      data: {
        eventType: 'plate.deficit.alert',
        context: 'stock',
        payload: {
          plateTypeId,
          currentStock: totalQuantity,
          threshold,
          timestamp: new Date(),
        },
      },
    });
  }
}
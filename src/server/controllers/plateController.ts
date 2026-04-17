// src/server/controllers/plateController.ts
import type { Request, Response } from 'express';
import { prisma } from '../prismaClient';
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
  async getActiveTypes(req: Request, res: Response) {
    try {
      const plateTypes = await prisma.plateType.findMany({
        where: { isActive: true },
        orderBy: { format: 'asc' },
      });
      
      const plateTypesWithStock = await Promise.all(
        plateTypes.map(async (plateType) => {
          const movements = await prisma.plateMovement.aggregate({
            where: { plateTypeId: plateType.id },
            _sum: { quantity: true },
          });
          
          const currentStock = movements._sum.quantity || 0;
          const isDeficit = currentStock < plateType.minStockThreshold;
          
          console.log(`Plate type ${plateType.format}: current stock = ${currentStock}`);
          
          return {
            ...plateType,
            currentStock,
            isDeficit,
          };
        })
      );
      
      res.json({
        success: true,
        data: plateTypesWithStock,
      });
    } catch (error) {
      console.error('Error fetching active plate types:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch active plate types' });
    }
  },

  async archiveType(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const plateTypeId = typeof id === 'string' ? id : id[0];

      const plateType = await prisma.plateType.update({
        where: { id: plateTypeId },
        data: { isActive: false, archivedAt: new Date() },
      });

      await prisma.eventLog.create({
        data: {
          eventType: 'plate.type.archived',
          context: 'stock',
          payload: { plateTypeId: plateType.id, format: plateType.format },
        },
      });

      res.json({ success: true, data: plateType });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ success: false, error: 'Plate type not found' });
      }
      res.status(500).json({ success: false, error: 'Failed to archive plate type' });
    }
  },

  async getAllTypes(req: Request, res: Response) {
    try {
      const plateTypes = await prisma.plateType.findMany({
        where: { isActive: true },
        orderBy: { format: 'asc' },
      });
      
      const plateTypesWithStock = await Promise.all(
        plateTypes.map(async (plateType) => {
          const movements = await prisma.plateMovement.aggregate({
            where: { plateTypeId: plateType.id },
            _sum: { quantity: true },
          });
          
          const currentStock = movements._sum.quantity || 0;
          const isDeficit = currentStock < plateType.minStockThreshold;
          
          console.log(`Plate ${plateType.format}: total movements sum = ${currentStock}`);
          
          return {
            ...plateType,
            currentStock,
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

  async getTypeById(req: Request, res: Response) {
    try {
      const { id } = req.params;
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
                  clientId: true,
                  clientOrderNum: true,
                  plateFormat: true,
                  totalPlates: true,
                  notesSnapshot: true,
                  createdAt: true,
                  updatedAt: true,
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

  async createType(req: Request, res: Response) {
    try {
      const validatedData = createPlateTypeSchema.parse(req.body);
      
      const dataToCreate = {
        format: validatedData.format,
        manufacturer: validatedData.manufacturer,
        otherParams: validatedData.otherParams ?? {},
        minStockThreshold: validatedData.minStockThreshold,
        areaSqm: validatedData.areaSqm,
      };

      const plateType = await prisma.plateType.create({
        data: dataToCreate,
      });

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

  async updateType(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const plateTypeId = typeof id === 'string' ? id : id[0];
      const validatedData = createPlateTypeSchema.partial().parse(req.body);
      
      const dataToUpdate: any = {};
      if (validatedData.format !== undefined) dataToUpdate.format = validatedData.format;
      if (validatedData.manufacturer !== undefined) dataToUpdate.manufacturer = validatedData.manufacturer;
      if (validatedData.otherParams !== undefined) dataToUpdate.otherParams = validatedData.otherParams;
      if (validatedData.areaSqm !== undefined) dataToUpdate.areaSqm = validatedData.areaSqm;
      
      const plateType = await prisma.plateType.update({
        where: { id: plateTypeId },
        data: dataToUpdate,
      });
      
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

  async updateThreshold(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const plateTypeId = typeof id === 'string' ? id : id[0];
      const validatedData = updatePlateTypeThresholdSchema.parse(req.body);
      
      const plateType = await prisma.plateType.update({
        where: { id: plateTypeId },
        data: { minStockThreshold: validatedData.minStockThreshold },
      });

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

  async recordPurchase(req: Request, res: Response) {
    try {
      const validatedData = recordPurchaseSchema.parse(req.body);
      
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
          reason: 'PURCHASE',
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

  async recordUsage(req: Request, res: Response) {
    try {
      const validatedData = recordUsageSchema.parse(req.body);
      
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

      if (order.status !== 'PROCESS') {
        return res.status(400).json({
          success: false,
          error: `Order must be in PROCESS status for plate usage. Current status: ${order.status}`,
        });
      }

      const movement = await prisma.plateMovement.create({
        data: {
          plateTypeId: validatedData.plateTypeId,
          quantity: -validatedData.quantity,
          movementType: 'OUTGOING',
          reason: 'NORMAL_USAGE',
          orderId: validatedData.orderId,
          responsibility: 'PRODUCTION',
          writeOffCount: validatedData.writeOffCount || validatedData.quantity,
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
          writeOffCount: validatedData.writeOffCount || validatedData.quantity,
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
          writeOffCount: validatedData.writeOffCount || validatedData.quantity,
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

  async recordScrapMaterial(req: Request, res: Response) {
    try {
      const validatedData = recordScrapMaterialSchema.parse(req.body);
      
      const plateType = await prisma.plateType.findUnique({
        where: { id: validatedData.plateTypeId },
      });

      if (!plateType) {
        return res.status(404).json({ success: false, error: 'Plate type not found' });
      }

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
          writeOffCount: validatedData.writeOffCount || validatedData.quantity,
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
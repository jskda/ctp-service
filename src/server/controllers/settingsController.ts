import type { Request, Response } from 'express';
import { prisma } from '../prismaClient';

const SYSTEM_SETTINGS_KEY = 'system';

export const settingsController = {
  // ============================================
  // System Settings
  // ============================================
async getSystemSettings(req: Request, res: Response) {
    try {
      const record = await prisma.systemSetting.findUnique({
        where: { key: SYSTEM_SETTINGS_KEY },
      });

      const defaultSettings = {
        companyName: 'CTP-Service',
        autoArchiveDays: 30,
        enableNotifications: true,
      };

      const data = record ? (record.value as any) : defaultSettings;

      res.json({ success: true, data });
    } catch (error) {
      console.error('Error fetching system settings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch system settings',
      });
    }
  },

  async updateSystemSettings(req: Request, res: Response) {
    try {
      const { companyName, autoArchiveDays, enableNotifications } = req.body;

      const value = {
        companyName,
        autoArchiveDays,
        enableNotifications,
      };

      const record = await prisma.systemSetting.upsert({
        where: { key: SYSTEM_SETTINGS_KEY },
        update: { value },
        create: { key: SYSTEM_SETTINGS_KEY, value },
      });

      res.json({
        success: true,
        data: record.value,
      });
    } catch (error) {
      console.error('Error updating system settings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update system settings',
      });
    }
  },

  // ============================================
  // Event Log Settings
  // ============================================
  async getEventLogSettings(req: Request, res: Response) {
    try {
      res.json({
        success: true,
        data: {
          retentionDays: 90,
          logLevel: 'INFO' as const,
          enabledEventTypes: [
            'order.created',
            'order.updated',
            'order.status_changed',
            'plate.movement',
            'plate.stock_low',
          ],
        },
      });
    } catch (error) {
      console.error('Error fetching event log settings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch event log settings',
      });
    }
  },

  async updateEventLogSettings(req: Request, res: Response) {
    try {
      const { retentionDays, logLevel, enabledEventTypes } = req.body;
      
      res.json({
        success: true,
        data: {
          retentionDays,
          logLevel,
          enabledEventTypes,
        },
      });
    } catch (error) {
      console.error('Error updating event log settings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update event log settings',
      });
    }
  },

  // ============================================
  // Plate Stock Info
  // ============================================
  async getPlateStock(req: Request, res: Response) {
    try {
      // Получаем все типы пластин
      const plateTypes = await prisma.plateType.findMany({
        where: { isActive: true },
      });

      // Рассчитываем остатки для каждого типа
      const stockInfo = await Promise.all(
        plateTypes.map(async (plateType) => {
          // Суммируем ВСЕ движения (и положительные, и отрицательные)
          const movements = await prisma.plateMovement.aggregate({
            where: { plateTypeId: plateType.id },
            _sum: { quantity: true },
          });
          
          const currentStock = movements._sum.quantity || 0;
          const isDeficit = currentStock < plateType.minStockThreshold;
          
          console.log(`Stock for ${plateType.format}: ${currentStock} (sum of all movements)`);
          
          return {
            plateTypeId: plateType.id,
            format: plateType.format,
            manufacturer: plateType.manufacturer,
            currentStock,
            minStockThreshold: plateType.minStockThreshold,
            isDeficit,
          };
        })
      );

      res.json({
        success: true,
        data: stockInfo,
      });
    } catch (error) {
      console.error('Error fetching plate stock:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch plate stock',
      });
    }
  },

  // ============================================
  // Update Plate Threshold
  // ============================================
  async updatePlateThreshold(req: Request, res: Response) {
    try {
      const { plateTypeId } = req.params;
      const { minStockThreshold } = req.body;

      await prisma.plateType.update({
        where: { id: plateTypeId },
        data: { minStockThreshold },
      });

      res.json({
        success: true,
        data: { plateTypeId, minStockThreshold },
      });
    } catch (error) {
      console.error('Error updating plate threshold:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update plate threshold',
      });
    }
  },

  // ============================================
  // System Statistics
  // ============================================
  async getStats(req: Request, res: Response) {
    try {
      const [
        totalOrders,
        activeOrders,
        totalClients,
        totalPlateTypes,
        lowStockItems,
        recentEvents,
      ] = await Promise.all([
        prisma.order.count(),
        prisma.order.count({ where: { status: { in: ['NEW', 'PROCESS'] } } }),
        prisma.client.count(),
        prisma.plateType.count(),
        prisma.plateType.findMany({
          include: {
            movements: true,
          },
        }).then(types =>
          types.filter(type => {
            const incoming = type.movements
              .filter(m => m.movementType === 'INCOMING')
              .reduce((sum, m) => sum + m.quantity, 0);
            
            const outgoing = type.movements
              .filter(m => m.movementType === 'OUTGOING')
              .reduce((sum, m) => sum + m.quantity, 0);
            
            return (incoming - outgoing) < type.minStockThreshold;
          }).length
        ),
        prisma.eventLog.count({ where: { timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
      ]);

      res.json({
        success: true,
        data: {
          totalOrders,
          activeOrders,
          totalClients,
          totalPlateTypes,
          lowStockItems,
          recentEvents,
        },
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch statistics',
      });
    }
  },
};
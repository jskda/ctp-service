import type { Request, Response } from 'express';
import { prisma } from '../app';

export const settingsController = {
  // ============================================
  // System Settings
  // ============================================
  async getSystemSettings(req: Request, res: Response) {
    try {
      // Возвращаем настройки по умолчанию или из БД
      res.json({
        success: true,
        data: {
          companyName: 'CTP-Service',
          currency: 'RUB',
          defaultColorMode: 'CMYK' as const,
          autoArchiveDays: 30,
          enableNotifications: true,
        },
      });
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
      const { companyName, currency, defaultColorMode, autoArchiveDays, enableNotifications } = req.body;
      
      // Здесь можно сохранить настройки в БД
      // Например, в таблицу SystemSettings
      
      res.json({
        success: true,
        data: {
          companyName,
          currency,
          defaultColorMode,
          autoArchiveDays,
          enableNotifications,
        },
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
      // Получаем все типы пластин с их остатками
      const plateTypes = await prisma.plateType.findMany({
        include: {
          movements: true,
        },
      });

      // Рассчитываем остатки для каждого типа
      const stockInfo = plateTypes.map((plateType) => {
        const totalIncoming = plateType.movements
          .filter(m => m.movementType === 'INCOMING')
          .reduce((sum, m) => sum + m.quantity, 0);
        
        const totalOutgoing = plateType.movements
          .filter(m => m.movementType === 'OUTGOING')
          .reduce((sum, m) => sum + m.quantity, 0);
        
        const currentStock = totalIncoming - totalOutgoing;
        const isDeficit = currentStock < plateType.minStockThreshold;

        return {
          plateTypeId: plateType.id,
          format: plateType.format,
          manufacturer: plateType.manufacturer,
          currentStock,
          minStockThreshold: plateType.minStockThreshold,
          isDeficit,
        };
      });

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
import { z } from 'zod';

// --- Client Validation ---
export const createClientSchema = z.object({
  name: z.string().min(1, 'Имя клиента обязательно'),
  techNotes: z.array(z.string()).optional(),
});

export const updateClientSchema = z.object({
  name: z.string().min(1, 'Имя клиента обязательно').optional(),
  techNotes: z.array(z.string()).optional(),
});

// --- Order Validation ---
export const createOrderSchema = z.object({
  clientId: z.string().min(1, 'ID клиента обязателен'),
  colorMode: z.enum(['CMYK', 'BLACK', 'MULTICOLOR']),
  notesSnapshot: z.record(z.unknown()).optional(),
});

export const updateOrderSchema = z.object({
  status: z.enum(['NEW', 'PROCESS', 'DONE']).optional(),
  notesSnapshot: z.record(z.unknown()).optional(),
});

// --- PlateType Validation ---
export const createPlateTypeSchema = z.object({
  format: z.string().min(1, 'Формат обязателен'),
  manufacturer: z.string().min(1, 'Производитель обязателен'),
  otherParams: z.record(z.unknown()).optional(),
  minStockThreshold: z.number().int().min(0).default(0),
});

export const updatePlateTypeSchema = z.object({
  format: z.string().min(1, 'Формат обязателен').optional(),
  manufacturer: z.string().min(1, 'Производитель обязателен').optional(),
  otherParams: z.record(z.unknown()).optional(),
  minStockThreshold: z.number().int().min(0).optional(),
});

// --- PlateMovement Validation ---
export const createPlateMovementSchema = z.object({
  plateTypeId: z.string().min(1, 'ID типа пластины обязателен'),
  quantity: z.number().int().nonzero('Количество не может быть нулевым'),
  movementType: z.enum(['INCOMING', 'OUTGOING']),
  reason: z.enum([
    'PURCHASE', 'RETURN', 'CORRECTION', 'NORMAL_USAGE',
    'SCRAP_CLIENT', 'SCRAP_PRODUCTION', 'SCRAP_MATERIAL',
    'LOSS_TEST', 'LOSS_CALIBRATION', 'LOSS_EQUIPMENT',
  ]),
  orderId: z.string().optional(),
  responsibility: z.enum(['CLIENT', 'PRODUCTION', 'MATERIALS']).optional(),
}).refine(
  (data) => {
    // responsibility обязателен для scrap и loss
    const isScrapOrLoss = data.reason.startsWith('SCRAP') || data.reason.startsWith('LOSS');
    return !isScrapOrLoss || (isScrapOrLoss && data.responsibility !== undefined);
  },
  {
    message: 'Поле responsibility обязательно для причин типа SCRAP или LOSS',
    path: ['responsibility'],
  }
);

// --- EventLog Validation ---
export const createEventLogSchema = z.object({
  eventType: z.string().min(1, 'Тип события обязателен'),
  context: z.enum(['order', 'stock', 'system']),
  payload: z.record(z.unknown()),
});
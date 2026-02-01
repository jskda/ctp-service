import { z } from 'zod';

// --- Client Validation ---
export const createClientSchema = z.object({
  name: z.string().min(1, 'Имя клиента обязательно'),
  techNotes: z.array(z.string()).optional(),
});

export const updateClientTechNotesSchema = z.object({
  techNotes: z.array(z.string()).optional(),
});

// --- Order Validation ---
export const createOrderSchema = z.object({
  clientId: z.string().min(1, 'ID клиента обязателен'),
  colorMode: z.enum(['CMYK', 'BLACK', 'MULTICOLOR']),
});

// Статус меняется только через действия, не через прямое редактирование
export const startOrderProcessingSchema = z.object({
  orderId: z.string().min(1, 'ID заказа обязателен'),
});

export const completeOrderSchema = z.object({
  orderId: z.string().min(1, 'ID заказа обязателен'),
});

// --- PlateType Validation ---
export const createPlateTypeSchema = z.object({
  format: z.string().min(1, 'Формат обязателен'),
  manufacturer: z.string().min(1, 'Производитель обязателен'),
  otherParams: z.record(z.string(), z.unknown()).optional(),
  minStockThreshold: z.number().int().min(0).default(0),
});

export const updatePlateTypeThresholdSchema = z.object({
  minStockThreshold: z.number().int().min(0),
});

// --- PlateMovement Validation - Поступление ---
export const recordPurchaseSchema = z.object({
  plateTypeId: z.string().min(1, 'ID типа пластины обязателен'),
  quantity: z.number().int().positive('Количество должно быть положительным'),
});

export const recordReturnSchema = z.object({
  plateTypeId: z.string().min(1, 'ID типа пластины обязателен'),
  quantity: z.number().int().positive('Количество должно быть положительным'),
});

export const recordCorrectionSchema = z.object({
  plateTypeId: z.string().min(1, 'ID типа пластины обязателен'),
  quantity: z.number().int().refine((val) => val !== 0, {
    message: 'Количество не может быть нулевым',
  }),
});

// --- PlateMovement Validation - Использование по заказу ---
export const recordUsageSchema = z.object({
  plateTypeId: z.string().min(1, 'ID типа пластины обязателен'),
  orderId: z.string().min(1, 'ID заказа обязателен'),
  quantity: z.number().int().positive('Количество должно быть положительным'),
});

// --- PlateMovement Validation - Брак ---
export const recordScrapClientSchema = z.object({
  plateTypeId: z.string().min(1, 'ID типа пластины обязателен'),
  orderId: z.string().min(1, 'ID заказа обязателен'),
  quantity: z.number().int().positive('Количество должно быть положительным'),
  reason: z.string().optional(), // Дополнительное описание причины
});

export const recordScrapProductionSchema = z.object({
  plateTypeId: z.string().min(1, 'ID типа пластины обязателен'),
  orderId: z.string().min(1, 'ID заказа обязателен'),
  quantity: z.number().int().positive('Количество должно быть положительным'),
  reason: z.string().optional(),
});

export const recordScrapMaterialSchema = z.object({
  plateTypeId: z.string().min(1, 'ID типа пластины обязателен'),
  orderId: z.string().optional(), // Опционально для брака материалов без заказа
  quantity: z.number().int().positive('Количество должно быть положительным'),
  reason: z.string().optional(),
});

// --- PlateMovement Validation - Производственные потери ---
export const recordLossTestSchema = z.object({
  plateTypeId: z.string().min(1, 'ID типа пластины обязателен'),
  quantity: z.number().int().positive('Количество должно быть положительным'),
});

export const recordLossCalibrationSchema = z.object({
  plateTypeId: z.string().min(1, 'ID типа пластины обязателен'),
  quantity: z.number().int().positive('Количество должно быть положительным'),
});

export const recordLossEquipmentSchema = z.object({
  plateTypeId: z.string().min(1, 'ID типа пластины обязателен'),
  quantity: z.number().int().positive('Количество должно быть положительным'),
  description: z.string().optional(), // Описание сбоя
});
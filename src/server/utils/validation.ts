// src/server/utils/validation.ts
import { z } from 'zod';

export const createClientSchema = z.object({
  name: z.string().min(1, 'Имя клиента обязательно'),
  internalCode: z.string().optional(),
  techNotes: z.array(z.string()).optional(),
});

export const updateClientTechNotesSchema = z.object({
  techNotes: z.array(z.string()).optional(),
  internalCode: z.string().optional(),
});

export const createOrderSchema = z.object({
  clientId: z.string().min(1, 'ID клиента обязателен'),
  clientOrderNum: z.string().optional(),
  plateFormat: z.string().min(1, 'Формат пластин обязателен'),
  totalPlates: z.number().int().min(1, 'Количество пластин должно быть не менее 1'),
});

export const createPlateTypeSchema = z.object({
  format: z.string().min(1, 'Формат обязателен'),
  manufacturer: z.string().min(1, 'Производитель обязателен'),
  otherParams: z.any().optional(),
  minStockThreshold: z.number().int().min(0).default(0),
});

export const updatePlateTypeThresholdSchema = z.object({
  minStockThreshold: z.number().int().min(0),
});

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

export const recordUsageSchema = z.object({
  plateTypeId: z.string().min(1, 'ID типа пластины обязателен'),
  orderId: z.string().min(1, 'ID заказа обязателен'),
  quantity: z.number().int().positive('Количество должно быть положительным'),
  writeOffCount: z.number().int().optional(),
});

export const recordScrapClientSchema = z.object({
  plateTypeId: z.string().min(1, 'ID типа пластины обязателен'),
  orderId: z.string().min(1, 'ID заказа обязателен'),
  quantity: z.number().int().positive('Количество должно быть положительным'),
  writeOffCount: z.number().int().optional(),
  reason: z.string().optional(),
});

export const recordScrapProductionSchema = z.object({
  plateTypeId: z.string().min(1, 'ID типа пластины обязателен'),
  orderId: z.string().min(1, 'ID заказа обязателен'),
  quantity: z.number().int().positive('Количество должно быть положительным'),
  writeOffCount: z.number().int().optional(),
  reason: z.string().optional(),
});

export const recordScrapMaterialSchema = z.object({
  plateTypeId: z.string().min(1, 'ID типа пластины обязателен'),
  orderId: z.string().optional(),
  quantity: z.number().int().positive('Количество должно быть положительным'),
  writeOffCount: z.number().int().optional(),
  reason: z.string().optional(),
});

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
  description: z.string().optional(),
});
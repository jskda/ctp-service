// src/client/types/index.ts
export type ColorMode = 'CMYK' | 'BLACK' | 'MULTICOLOR';
export type OrderStatus = 'NEW' | 'PROCESS' | 'DONE';
export type MovementType = 'INCOMING' | 'OUTGOING';
export type MovementReason = 
  | 'PURCHASE' | 'RETURN' | 'CORRECTION'
  | 'NORMAL_USAGE'
  | 'SCRAP_CLIENT' | 'SCRAP_PRODUCTION' | 'SCRAP_MATERIAL'
  | 'LOSS_TEST' | 'LOSS_CALIBRATION' | 'LOSS_EQUIPMENT';
export type Responsibility = 'CLIENT' | 'PRODUCTION' | 'MATERIALS' | null;

export interface Client {
  id: string;
  name: string;
  techNotes?: string[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  clientId: string;
  client?: Client;
  colorMode: ColorMode;
  status: OrderStatus;
  notesSnapshot?: {
    clientTechNotes?: string[];
    automatedNotes?: string[];
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PlateType {
  id: string;
  format: string;
  manufacturer: string;
  otherParams?: any;
  minStockThreshold: number;
  currentStock?: number;
  isDeficit?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlateMovement {
  id: string;
  plateTypeId: string;
  plateType?: PlateType;
  quantity: number;
  movementType: MovementType;
  reason: MovementReason;
  responsibility?: Responsibility;
  orderId?: string;
  order?: Order;
  createdAt: string;
}

export interface PlateTypeThreshold {
  plateTypeId: string;
  format: string;
  manufacturer: string;
  currentStock: number;
  minStockThreshold: number;
  isDeficit: boolean;
}

export interface EventLog {
  id: string;
  eventType: string;
  context: string;
  payload: any;
  timestamp: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  count?: number;
  error?: string;
  details?: any;
  message?: string;
}
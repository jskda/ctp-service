// src/client/types/index.ts
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
  isActive?: boolean;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlateType {
  id: string;
  format: string;
  manufacturer: string;
  otherParams?: any;
  minStockThreshold: number;
  areaSqm?: number | null;
  currentStock?: number;
  isDeficit?: boolean;
  isActive?: boolean;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  clientId: string;
  client?: Client;
  status: OrderStatus;
  clientOrderNum?: string | null;
  plateFormat: string;
  totalPlates: number;
  notesSnapshot?: {
    clientTechNotes?: string[];
    [key: string]: any;
  };
  plateMovements?: PlateMovement[];
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
  writeOffCount?: number | null;
  createdAt: string;
}

export interface DeveloperBatch {
  id: string;
  startedAt: string;
  volumeLiters: number;
  concentrateName?: string | null;
  concentrateRatio?: string | null;
  maxAreaSqm?: number | null;
  notes?: string | null;
  isActive: boolean;
  endedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeveloperStatus extends DeveloperBatch {
  totalArea: number;
  usagePercent: number | null;
  rasterDeviation: {
    avg75: number;
    avg80: number;
    status: 'normal' | 'warning';
  };
  orderCount?: number;
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
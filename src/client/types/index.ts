export type ColorMode = 'CMYK' | 'BLACK' | 'MULTICOLOR';
export type OrderStatus = 'NEW' | 'PROCESS' | 'DONE';

export interface Client {
  id: string;
  name: string;
  techNotes?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  clientId: string;
  client?: Client;
  colorMode: ColorMode;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  notesSnapshot?: {
    clientTechNotes?: string[];
    automatedNotes?: string[];
  };
}

export interface PlateType {
  id: string;
  format: string;
  manufacturer: string;
  otherParams?: Record<string, any>;
  minStockThreshold: number;
  currentStock?: number;
  isDeficit?: boolean;
}

export interface StockDeficit {
  plateTypeId: string;
  format: string;
  manufacturer: string;
  currentStock: number;
  minStockThreshold: number;
  isDeficit: boolean;
}

// API Response wrappers
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  error?: string;
  details?: any;
}
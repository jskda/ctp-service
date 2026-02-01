export type ColorMode = 'CMYK' | 'BLACK' | 'MULTICOLOR';
export type OrderStatus = 'new' | 'process' | 'done';

export interface Client {
  clientId: string;
  name: string;
  techNotes: string[];
}

export interface Order {
  orderId: string;
  clientId: string;
  client?: Client;
  colorMode: ColorMode;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  notesSnapshot: {
    clientNotes?: string[];
    autoMarks?: string[];
  };
}

export interface PlateType {
  plateTypeId: string;
  format: string;
  manufacturer: string;
  otherParams?: Record<string, any>;
  minStockThreshold: number;
  currentStock?: number;
}

export interface StockDeficit {
  plateTypeId: string;
  plateType: PlateType;
  currentStock: number;
  threshold: number;
  deficit: number;
}
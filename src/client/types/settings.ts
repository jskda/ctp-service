// src/client/types/settings.ts
export interface SystemSettings {
  companyName: string;
  autoArchiveDays: number;
  enableNotifications: boolean;
}

export interface PlateTypeThreshold {
  plateTypeId: string;
  plateTypeName: string;
  minStockThreshold: number;
  currentStock: number;
  format: string;
  manufacturer: string;
}

export interface ClientSettings {
  clientId: string;
  clientName: string;
  techNotes?: Record<string, any>;
}

export interface EventLogSettings {
  retentionDays: number;
  enabledEventTypes: string[];
  logLevel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
}

export interface NotificationSettings {
  emailNotifications: boolean;
  lowStockAlert: boolean;
  lowStockThreshold: number;
  orderStatusChange: boolean;
}

export interface Settings {
  system: SystemSettings;
  eventLog: EventLogSettings;
  notifications: NotificationSettings;
}
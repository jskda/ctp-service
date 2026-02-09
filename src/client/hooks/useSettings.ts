import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { ApiResponse } from '@/types';

export interface SystemSettings {
  companyName: string;
  currency: string;
  defaultColorMode: 'CMYK' | 'BLACK' | 'MULTICOLOR';
  autoArchiveDays: number;
  enableNotifications: boolean;
}

export interface PlateTypeThreshold {
  plateTypeId: string;
  format: string;
  manufacturer: string;
  currentStock: number;
  minStockThreshold: number;
  isDeficit: boolean;
}

export interface EventLogSettings {
  retentionDays: number;
  logLevel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  enabledEventTypes: string[];
}

export interface NotificationSettings {
  emailNotifications: boolean;
  lowStockAlert: boolean;
  lowStockThreshold: number;
  orderStatusChange: boolean;
}

export function useSystemSettings() {
  return useQuery({
    queryKey: ['settings', 'system'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<SystemSettings>>('/api/settings/system');
      return response.data;
    },
  });
}

export function useUpdateSystemSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (settings: Partial<SystemSettings>) => {
      const response = await apiClient.put<ApiResponse<SystemSettings>>(
        '/api/settings/system',
        settings
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'system'] });
    },
  });
}

export function usePlateTypeThresholds() {
  return useQuery({
    queryKey: ['settings', 'plate-thresholds'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<PlateTypeThreshold[]>>('/api/settings/plates/stock');
      return response.data;
    },
  });
}

export function useUpdatePlateThreshold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ plateTypeId, minStockThreshold }: { plateTypeId: string; minStockThreshold: number }) => {
      const response = await apiClient.put<ApiResponse<any>>(
        `/api/plates/types/${plateTypeId}/threshold`,
        { minStockThreshold }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'plate-thresholds'] });
      queryClient.invalidateQueries({ queryKey: ['plate-types'] });
    },
  });
}

export function useEventLogSettings() {
  return useQuery({
    queryKey: ['settings', 'event-log'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<EventLogSettings>>(
        '/api/settings/event-log'
      );
      return response.data;
    },
  });
}

export function useUpdateEventLogSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (settings: Partial<EventLogSettings>) => {
      const response = await apiClient.put<ApiResponse<EventLogSettings>>(
        '/api/settings/event-log',
        settings
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'event-log'] });
    },
  });
}

export function useNotificationSettings() {
  return useQuery({
    queryKey: ['settings', 'notifications'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<NotificationSettings>>(
        '/api/settings/notifications'
      );
      return response.data;
    },
  });
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (settings: Partial<NotificationSettings>) => {
      const response = await apiClient.put<ApiResponse<NotificationSettings>>(
        '/api/settings/notifications',
        settings
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'notifications'] });
    },
  });
}

export function useSystemStats() {
  return useQuery({
    queryKey: ['settings', 'stats'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<{
        totalOrders: number;
        activeOrders: number;
        totalClients: number;
        totalPlateTypes: number;
        lowStockItems: number;
        recentEvents: number;
      }>>('/api/settings/stats');
      return response.data;
    },
  });
}
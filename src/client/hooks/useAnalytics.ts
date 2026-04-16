import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { ApiResponse } from '@/types';

export interface ProcessControlWithOrder {
  id: string;
  orderId: string;
  measurements: any[];
  speed?: number | null;
  temperature?: number | null;
  notes?: string | null;
  createdAt: string;
  order: {
    plateFormat: string;
    totalPlates: number;
    client: { name: string };
  };
}

export interface AnalyticsSummary {
  totalOrders: number;
  activeOrders: number;
  totalUsedPlates: number;
  scrap: {
    CLIENT: number;
    PRODUCTION: number;
    MATERIALS: number;
  };
  lastControl: ProcessControlWithOrder | null;
  forecast: {
    avgDeviation75: number;
    avgDeviation80: number;
    status: 'normal' | 'warning' | 'critical';
  };
}

export function useProcessControls(filters?: { from?: string; to?: string; plateFormat?: string }) {
  const params = new URLSearchParams();
  if (filters?.from) params.append('from', filters.from);
  if (filters?.to) params.append('to', filters.to);
  if (filters?.plateFormat) params.append('plateFormat', filters.plateFormat);

  return useQuery({
    queryKey: ['analytics', 'process-controls', filters],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<ProcessControlWithOrder[]>>(
        `/api/analytics/process-controls?${params.toString()}`
      );
      return response.data;
    },
  });
}

export function useAnalyticsSummary(filters?: { from?: string; to?: string }) {
  const params = new URLSearchParams();
  if (filters?.from) params.append('from', filters.from);
  if (filters?.to) params.append('to', filters.to);

  return useQuery({
    queryKey: ['analytics', 'summary', filters],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<AnalyticsSummary>>(
        `/api/analytics/summary?${params.toString()}`
      );
      return response.data;
    },
  });
}

export function usePlateFormats() {
  return useQuery({
    queryKey: ['analytics', 'formats'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<string[]>>('/api/analytics/plate-formats');
      return response.data;
    },
  });
}
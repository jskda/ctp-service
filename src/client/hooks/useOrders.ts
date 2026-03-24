// src/client/hooks/useOrders.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Order, ApiResponse } from '@/types';

export interface CreateOrderData {
  clientId: string;
  colorMode: string;
  clientOrderNum?: string;
  plateFormat: string;
  totalPlates: number;
}

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<Order[]>>('/api/orders');
      return response.data;
    },
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateOrderData) => {
      const response = await apiClient.post<ApiResponse<Order>>('/api/orders', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useStartProcessing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiClient.post<ApiResponse<Order>>(`/api/orders/${orderId}/start-processing`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useCompleteOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiClient.post<ApiResponse<Order>>(`/api/orders/${orderId}/complete`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

// Действие для списания пластин (брак)
export function useRecordScrap() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      plateTypeId: string;
      orderId: string;
      quantity: number;
      reason: 'SCRAP_CLIENT' | 'SCRAP_PRODUCTION' | 'SCRAP_MATERIAL';
      writeOffCount?: number;
    }) => {
      const endpoint = `/api/plates/movements/scrap/${data.reason === 'SCRAP_CLIENT' ? 'client' : data.reason === 'SCRAP_PRODUCTION' ? 'production' : 'material'}`;
      const response = await apiClient.post<ApiResponse>(endpoint, {
        plateTypeId: data.plateTypeId,
        orderId: data.orderId,
        quantity: data.quantity,
        writeOffCount: data.writeOffCount,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['plates'] });
    },
  });
}
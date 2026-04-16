// src/client/hooks/useOrders.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Order, ApiResponse } from '@/types';

export interface CreateOrderData {
  clientId: string;
  plateFormat: string;
  clientOrderNum?: string;
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
      const response = await apiClient.post<ApiResponse<Order>>('/api/orders', {
        clientId: data.clientId,
        clientOrderNum: data.clientOrderNum,
        plateFormat: data.plateFormat,
        totalPlates: data.totalPlates,
      });
      return response.data;
    },
    onSuccess: () => {
      // Обновляем оба квери - и заказы, и остатки пластин
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['plate-types'] });
      queryClient.invalidateQueries({ queryKey: ['settings', 'plate-thresholds'] });
    },
    onError: (error: any) => {
      console.error('Create order error:', error);
      throw error;
    },
  });
}

export function useAddProcessControl() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, data }: { orderId: string; data: any }) => {
      const response = await apiClient.post(`/api/orders/${orderId}/process-control`, data);
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
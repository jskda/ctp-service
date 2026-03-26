// src/client/hooks/usePlateMovements.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { ApiResponse } from '@/types';

export function useRecordPurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { plateTypeId: string; quantity: number }) => {
      const response = await apiClient.post<ApiResponse>('/api/plates/movements/purchase', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'plate-thresholds'] });
      queryClient.invalidateQueries({ queryKey: ['plate-types'] });
    },
  });
}

export function useRecordReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { plateTypeId: string; quantity: number }) => {
      const response = await apiClient.post<ApiResponse>('/api/plates/movements/return', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'plate-thresholds'] });
      queryClient.invalidateQueries({ queryKey: ['plate-types'] });
    },
  });
}

export function useRecordCorrection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { plateTypeId: string; quantity: number }) => {
      const response = await apiClient.post<ApiResponse>('/api/plates/movements/correction', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'plate-thresholds'] });
      queryClient.invalidateQueries({ queryKey: ['plate-types'] });
    },
  });
}
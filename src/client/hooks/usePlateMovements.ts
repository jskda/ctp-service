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

export function useRecordScrapClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      plateTypeId: string;
      orderId: string;
      quantity: number;
      writeOffCount?: number;
      reason?: string;
    }) => {
      const response = await apiClient.post<ApiResponse>('/api/plates/movements/scrap/client', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['plate-types'] });
      queryClient.invalidateQueries({ queryKey: ['settings', 'plate-thresholds'] });
    },
  });
}

export function useRecordScrapProduction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      plateTypeId: string;
      orderId: string;
      quantity: number;
      writeOffCount?: number;
      reason?: string;
    }) => {
      const response = await apiClient.post<ApiResponse>('/api/plates/movements/scrap/production', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['plate-types'] });
      queryClient.invalidateQueries({ queryKey: ['settings', 'plate-thresholds'] });
    },
  });
}

export function useRecordScrapMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      plateTypeId: string;
      orderId: string;
      quantity: number;
      writeOffCount?: number;
      reason?: string;
    }) => {
      const response = await apiClient.post<ApiResponse>('/api/plates/movements/scrap/material', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['plate-types'] });
      queryClient.invalidateQueries({ queryKey: ['settings', 'plate-thresholds'] });
    },
  });
}
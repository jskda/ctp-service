// src/client/hooks/usePlateTypes.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { PlateType, ApiResponse } from '@/types';

export function usePlateTypes() {
  return useQuery({
    queryKey: ['plate-types'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<PlateType[]>>('/api/plates/types');
      console.log('All plate types:', response.data);
      return response.data;
    },
  });
}

export function useActivePlateTypes() {
  return useQuery({
    queryKey: ['plate-types', 'active'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<PlateType[]>>('/api/plates/types/active');
      console.log('Active plate types:', response.data);
      return response.data;
    },
  });
}

export function useCreatePlateType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      format: string;
      manufacturer: string;
      minStockThreshold?: number;
      otherParams?: any;
    }) => {
      const response = await apiClient.post<ApiResponse<PlateType>>('/api/plates/types', {
        ...data,
        minStockThreshold: data.minStockThreshold ?? 0,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plate-types'] });
      queryClient.invalidateQueries({ queryKey: ['plate-types', 'active'] });
      queryClient.invalidateQueries({ queryKey: ['settings', 'plate-thresholds'] });
    },
  });
}

export function useUpdatePlateType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PlateType> }) => {
      const response = await apiClient.put<ApiResponse<PlateType>>(`/api/plates/types/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plate-types'] });
      queryClient.invalidateQueries({ queryKey: ['plate-types', 'active'] });
      queryClient.invalidateQueries({ queryKey: ['settings', 'plate-thresholds'] });
    },
  });
}

export function useArchivePlateType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete<ApiResponse<PlateType>>(`/api/plates/types/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plate-types'] });
      queryClient.invalidateQueries({ queryKey: ['plate-types', 'active'] });
      queryClient.invalidateQueries({ queryKey: ['settings', 'plate-thresholds'] });
    },
  });
}
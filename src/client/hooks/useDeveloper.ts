import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { DeveloperStatus, DeveloperBatch, ApiResponse } from '@/types';

export function useDeveloperStatus() {
  return useQuery({
    queryKey: ['developer', 'status'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<DeveloperStatus | null>>(
        '/api/developer/status'
      );
      // apiClient возвращает распарсенный JSON, который имеет тип ApiResponse
      // поэтому response.data — это уже DeveloperStatus | null
      return response.data;
    },
    refetchInterval: 60000,
  });
}

export function useDeveloperHistory() {
  return useQuery({
    queryKey: ['developer', 'history'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<DeveloperStatus[]>>(
        '/api/developer/history'
      );
      return response.data;
    },
  });
}

export function useReplaceDeveloper() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      volumeLiters: number;
      concentrateName?: string;
      concentrateRatio?: string;
      maxAreaSqm?: number;
      notes?: string;
    }) => {
      const response = await apiClient.post<ApiResponse<DeveloperBatch>>(
        '/api/developer/replace',
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['developer'] });
    },
    onError: (error: any) => {
      alert(`Ошибка при замене проявителя: ${error.message || 'Неизвестная ошибка'}`);
    },
  });
}
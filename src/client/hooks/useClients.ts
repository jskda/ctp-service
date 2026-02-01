import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Client, ApiResponse } from '@/types';

export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<Client[]>>('/clients');
      return response.data;
    },
  });
}
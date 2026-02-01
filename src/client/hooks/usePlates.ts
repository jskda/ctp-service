import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { StockDeficit, ApiResponse } from '@/types';

export function useDeficit() {
  return useQuery({
    queryKey: ['deficit'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<StockDeficit[]>>('/plates/stock');
      return response.data.filter(item => item.isDeficit);
    },
  });
}
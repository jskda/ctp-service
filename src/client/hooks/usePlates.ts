import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { StockDeficit } from '@/types';

export function useDeficit() {
  return useQuery({
    queryKey: ['deficit'],
    queryFn: () => apiClient.get<StockDeficit[]>('/plates/stock'),
  });
}
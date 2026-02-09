import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { PlateTypeThreshold, ApiResponse } from '@/types';

export function useDeficit() {
  return useQuery({
    queryKey: ['deficit'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<PlateTypeThreshold[]>>('/api/settings/plates/stock');
      const data = response.data || [];
      return data.filter(item => item.isDeficit);
    },
  });
}
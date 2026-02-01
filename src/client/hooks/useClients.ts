import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Client } from '@/types';

export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: () => apiClient.get<Client[]>('/clients'),
  });
}
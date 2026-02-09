// src/client/hooks/useActions.ts
import { useStartProcessing, useCompleteOrder } from './useOrders';
import { Order } from '@/types';
import { useQueryClient } from '@tanstack/react-query';

export function useOrderActions() {
  const queryClient = useQueryClient();
  const startProcessing = useStartProcessing();
  const completeOrder = useCompleteOrder();

  const invalidateOrders = () => {
    queryClient.invalidateQueries({ queryKey: ['orders'] });
  };

  return {
    canStart: (order: Order) => order.status === 'NEW',
    canComplete: (order: Order) => order.status === 'PROCESS',
    startProcessing,
    completeOrder,
    invalidateOrders,
  };
}
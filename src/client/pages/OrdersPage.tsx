import { useOrders, useCreateOrder, useStartProcessing, useCompleteOrder } from "@/hooks/useOrders";
import { useClients } from "@/hooks/useClients";
import { useDeficit } from "@/hooks/usePlates";
import { OrderList } from "@/components/orders/OrderList";
import { CreateOrderDialog } from "@/components/orders/CreateOrderDialog";
import { Header } from "@/components/layout/Header";
import { MainLayout } from "@/components/layout/MainLayout";
import { useState } from "react";

export function OrdersPage() {
  const { data: orders = [], isLoading: ordersLoading, error: ordersError } = useOrders();
  const { data: clients = [], error: clientsError } = useClients();
  const { data: deficits = [], error: deficitError } = useDeficit();
  
  const createOrderMutation = useCreateOrder();
  const startProcessingMutation = useStartProcessing();
  const completeOrderMutation = useCompleteOrder();

  const [folderStatus, setFolderStatus] = useState<Record<string, boolean>>({});

  const handleOrderAction = async (action: string, orderId: string) => {
    try {
      switch (action) {
        case 'start-processing':
          await startProcessingMutation.mutateAsync(orderId);
          break;
        case 'complete':
          await completeOrderMutation.mutateAsync(orderId);
          break;
        case 'create-folder':
          alert('Создание папки пока не реализовано в бэкенде');
          break;
        case 'open-folder':
          alert('Открытие папки пока не реализовано в бэкенде');
          break;
        default:
          console.warn(`Unknown action: ${action}`);
      }
    } catch (error) {
      console.error('Action failed:', error);
      alert(`Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  };

  const handleCreateOrder = async (data: { clientId: string; colorMode: string }) => {
    try {
      await createOrderMutation.mutateAsync(data);
    } catch (error) {
      console.error('Create order failed:', error);
      alert(`Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  };

  // Показываем ошибки если они есть
  if (ordersError || clientsError || deficitError) {
    return (
      <MainLayout>
        <div className="text-destructive p-4">
          <h2 className="font-bold mb-2">Ошибки загрузки:</h2>
          {ordersError && <div>Заказы: {ordersError.message}</div>}
          {clientsError && <div>Клиенты: {clientsError.message}</div>}
          {deficitError && <div>Дефицит: {deficitError.message}</div>}
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <Header deficits={deficits} />
        
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Заказы</h2>
          <CreateOrderDialog clients={clients} onCreate={handleCreateOrder} />
        </div>

        {ordersLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Загрузка...
          </div>
        ) : (
          <OrderList
            orders={orders}
            onAction={handleOrderAction}
            folderStatus={folderStatus}
          />
        )}
      </div>
    </MainLayout>
  );
}
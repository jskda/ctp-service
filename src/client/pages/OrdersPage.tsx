import { useOrders, useCreateOrder, useStartProcessing, useCompleteOrder, useCreateOrderFolder, useOpenOrderFolder } from "@/hooks/useOrders";
import { useClients } from "@/hooks/useClients";
import { useDeficit } from "@/hooks/useDeficit";
import { OrderList } from "@/components/orders/OrderList";
import { CreateOrderDialog } from "@/components/orders/CreateOrderDialog";
import { Header } from "@/components/layout/Header";
import { MainLayout } from "@/components/layout/MainLayout";
import { useState } from "react";

export function OrdersPage() {
  const { data: orders = [], isLoading: ordersLoading } = useOrders();
  const { data: clients = [] } = useClients();
  const { data: deficits = [] } = useDeficit();
  
  const createOrderMutation = useCreateOrder();
  const startProcessingMutation = useStartProcessing();
  const completeOrderMutation = useCompleteOrder();
  const createFolderMutation = useCreateOrderFolder();
  const openFolderMutation = useOpenOrderFolder();

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
          await createFolderMutation.mutateAsync(orderId);
          setFolderStatus(prev => ({ ...prev, [orderId]: true }));
          break;
        case 'open-folder':
          await openFolderMutation.mutateAsync(orderId);
          break;
        default:
          console.warn(`Unknown action: ${action}`);
      }
    } catch (error) {
      console.error('Action failed:', error);
      alert(`Ошибка при выполнении действия: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  };

  const handleCreateOrder = async (data: { clientId: string; colorMode: string }) => {
    try {
      await createOrderMutation.mutateAsync(data);
    } catch (error) {
      console.error('Create order failed:', error);
      alert(`Ошибка при создании заказа: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  };

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
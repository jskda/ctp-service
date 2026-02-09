// src/client/pages/OrdersPage.tsx
import { useState } from "react";
import { useOrders, useCreateOrder, useStartProcessing, useCompleteOrder } from "@/hooks/useOrders";
import { useClients } from "@/hooks/useClients";
import { useDeficit } from "@/hooks/useDeficit";
import { OrderList } from "@/components/orders/OrderList";
import { CreateOrderDialog } from "@/components/orders/CreateOrderDialog";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function OrdersPage() {
  const { 
    data: orders, 
    isLoading, 
    error,
    refetch 
  } = useOrders();
  
  const { data: clients } = useClients();
  const { data: deficits } = useDeficit();
  const createOrderMutation = useCreateOrder();
  const startProcessingMutation = useStartProcessing();
  const completeOrderMutation = useCompleteOrder();
  
  const [folderStatus] = useState<Record<string, boolean>>({});

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
          // TODO: Интеграция с файловым агентом согласно разделу 6
          console.log('Создание папки для заказа:', orderId);
          break;
        case 'open-folder':
          // TODO: Интеграция с файловым агентом согласно разделу 6
          console.log('Открытие папки заказа:', orderId);
          break;
        default:
          console.log(`Action ${action} for order ${orderId}`);
      }
    } catch (error) {
      console.error('Error handling order action:', error);
    }
  };

  const handleCreateOrder = async (data: { clientId: string; colorMode: string }) => {
    try {
      await createOrderMutation.mutateAsync(data);
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Загрузка заказов...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
          <p className="text-destructive font-medium">Ошибка загрузки заказов</p>
          <p className="text-sm text-muted-foreground mt-1">
            {(error as Error).message || 'Не удалось загрузить данные'}
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-3"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Повторить
          </Button>
        </div>
      </div>
    );
  }

  // Фильтруем заказы для демонстрации разных статусов
  const newOrders = orders?.filter(o => o.status === 'NEW') || [];
  const processOrders = orders?.filter(o => o.status === 'PROCESS') || [];
  const doneOrders = orders?.filter(o => o.status === 'DONE') || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Заказы</h1>
          <p className="text-muted-foreground mt-2">
            Управление заказами согласно спецификации (статусы: NEW → PROCESS → DONE)
          </p>
        </div>
        
        <CreateOrderDialog
          clients={clients || []}
          onCreate={handleCreateOrder}
        />
      </div>

      {/* Информация о контрольных пометках согласно спецификации */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Согласно спецификации:</strong> Для MULTICOLOR заказов автоматически добавляется контрольная пометка "Overprint control". Для BLACK заказов определённых клиентов добавляется условная пометка.
        </AlertDescription>
      </Alert>

      {(!orders || orders.length === 0) ? (
        <div className="text-center py-12 border rounded-lg bg-muted/30">
          <div className="max-w-md mx-auto">
            <div className="text-muted-foreground mb-4">📭</div>
            <h3 className="text-lg font-medium mb-2">Заказов пока нет</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Создайте первый заказ, чтобы начать работу. Система автоматически добавит контрольные пометки согласно выбранной красочности.
            </p>
            <CreateOrderDialog
              clients={clients || []}
              onCreate={handleCreateOrder}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Новые заказы */}
          {newOrders.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Новые ({newOrders.length})</h2>
              <OrderList
                orders={newOrders}
                onAction={handleOrderAction}
                folderStatus={folderStatus}
              />
            </div>
          )}

          {/* Заказы в работе */}
          {processOrders.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">В работе ({processOrders.length})</h2>
              <OrderList
                orders={processOrders}
                onAction={handleOrderAction}
                folderStatus={folderStatus}
              />
            </div>
          )}

          {/* Завершенные заказы */}
          {doneOrders.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Завершённые ({doneOrders.length})</h2>
              <OrderList
                orders={doneOrders}
                onAction={handleOrderAction}
                folderStatus={folderStatus}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
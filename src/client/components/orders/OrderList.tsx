import { Order } from "@/types";
import { OrderCard } from "./OrderCard";

interface OrderListProps {
  orders: Order[];
  onAction: (action: string, orderId: string) => void;
  folderStatus: Record<string, boolean>;
}

export function OrderList({ orders, onAction, folderStatus }: OrderListProps) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Нет заказов
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <OrderCard
          key={order.orderId}
          order={order}
          onAction={onAction}
          hasFolder={folderStatus[order.orderId] || false}
        />
      ))}
    </div>
  );
}
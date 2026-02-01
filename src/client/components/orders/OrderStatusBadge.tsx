import { Badge } from "@/components/ui/badge";
import { OrderStatus } from "@/types";

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const variantMap: Record<OrderStatus, "default" | "secondary" | "outline"> = {
    NEW: "outline",
    PROCESS: "default",
    DONE: "secondary",
  };

  const labelMap: Record<OrderStatus, string> = {
    NEW: "Новый",
    PROCESS: "В работе",
    DONE: "Завершён",
  };

  return (
    <Badge variant={variantMap[status]}>
      {labelMap[status]}
    </Badge>
  );
}
import { Badge } from "@/components/ui/badge";
import { OrderStatus } from "@/types";

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const variantMap: Record<OrderStatus, "default" | "secondary" | "outline"> = {
    new: "outline",
    process: "default",
    done: "secondary",
  };

  const labelMap: Record<OrderStatus, string> = {
    new: "Новый",
    process: "В работе",
    done: "Завершён",
  };

  return (
    <Badge variant={variantMap[status]}>
      {labelMap[status]}
    </Badge>
  );
}
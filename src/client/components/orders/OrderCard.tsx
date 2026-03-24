// src/client/components/orders/OrderCard.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Order } from "@/types";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { Button } from "@/components/ui/button";
import { FileText, FolderOpen, AlertTriangle, CheckCircle, Package, Hash, Ruler } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface OrderCardProps {
  order: Order;
  onAction: (action: string, orderId: string) => void;
  hasFolder: boolean;
}

export function OrderCard({ order, onAction, hasFolder }: OrderCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (action: string) => {
    setIsLoading(true);
    try {
      await onAction(action, order.id);
    } finally {
      setIsLoading(false);
    }
  };

  const renderActions = () => {
    const actions = [];

    if (order.status === 'NEW') {
      actions.push(
        <Button
          key="start"
          size="sm"
          onClick={() => handleAction('start-processing')}
          disabled={isLoading}
        >
          В работу (RIP + вывод)
        </Button>
      );
    }

    if (order.status === 'PROCESS') {
      actions.push(
        <Button
          key="complete"
          size="sm"
          variant="outline"
          onClick={() => handleAction('complete')}
          disabled={isLoading}
        >
          Завершить заказ
        </Button>
      );
    }

    actions.push(
      <Button
        key="folder"
        size="sm"
        variant="ghost"
        onClick={() => handleAction(hasFolder ? 'open-folder' : 'create-folder')}
        disabled={isLoading}
      >
        {hasFolder ? (
          <>
            <FolderOpen className="mr-2 h-4 w-4" />
            Открыть папку
          </>
        ) : (
          <>
            <FileText className="mr-2 h-4 w-4" />
            Создать папку
          </>
        )}
      </Button>
    );

    return actions;
  };

  const hasClientNotes = order.notesSnapshot?.clientTechNotes && order.notesSnapshot.clientTechNotes.length > 0;

  const writeOffCount = order.plateMovements?.reduce((total, movement) => {
    if (movement.reason?.startsWith('SCRAP_') && movement.writeOffCount) {
      return total + movement.writeOffCount;
    }
    return total;
  }, 0) || 0;

  const remainingPlates = order.totalPlates - writeOffCount;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              Заказ #{order.id.slice(0, 8)}
              {order.clientOrderNum && (
                <Badge variant="outline" className="text-xs font-normal">
                  <Hash className="h-3 w-3 mr-1" />
                  {order.clientOrderNum}
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {order.client?.name || 'Клиент не указан'}
                {order.client?.internalCode && ` (${order.client.internalCode})`}
              </span>
              <OrderStatusBadge status={order.status} />
            </div>
          </div>
          <div className="flex gap-2">
            {renderActions()}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-md">
            <div className="flex items-center gap-2">
              <Ruler className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Формат</div>
                <div className="font-medium">{order.plateFormat}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Всего пластин</div>
                <div className="font-medium">{order.totalPlates}</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-md">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">Списано / Осталось</div>
              <div className={`font-medium ${writeOffCount > 0 ? 'text-destructive' : ''}`}>
                {writeOffCount} / {remainingPlates}
              </div>
            </div>
          </div>

          {hasClientNotes && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">
                Технологические настройки клиента (снапшот):
              </div>
              <div className="bg-blue-50 border border-blue-100 p-3 rounded-md">
                <ul className="space-y-1">
                  {order.notesSnapshot.clientTechNotes.map((note: string, idx: number) => (
                    <li key={idx} className="text-sm text-blue-800 flex items-start gap-2">
                      <CheckCircle className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
                <div className="text-xs text-blue-600 mt-2">
                  Согласно спецификации 5.1.3: снапшот на момент создания заказа
                </div>
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground flex justify-between pt-2 border-t">
            <span>Создан: {new Date(order.createdAt).toLocaleString('ru-RU')}</span>
            {order.updatedAt !== order.createdAt && (
              <span>Обновлён: {new Date(order.updatedAt).toLocaleString('ru-RU')}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
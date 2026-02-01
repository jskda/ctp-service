import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Order, ColorMode } from "@/types";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { ColorModeBadge } from "./ColorModeBadge";
import { AutoMarkBadge } from "./AutoMarkBadge";
import { Button } from "@/components/ui/button";
import { FileText, FolderOpen } from "lucide-react";
import { useState } from "react";

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
      await onAction(action, order.orderId);
    } finally {
      setIsLoading(false);
    }
  };

  const renderActions = () => {
    const actions = [];

    if (order.status === 'new') {
      actions.push(
        <Button
          key="start"
          size="sm"
          onClick={() => handleAction('start-processing')}
          disabled={isLoading}
        >
          В работу
        </Button>
      );
    }

    if (order.status === 'process') {
      actions.push(
        <Button
          key="complete"
          size="sm"
          variant="outline"
          onClick={() => handleAction('complete')}
          disabled={isLoading}
        >
          Завершить
        </Button>
      );
    }

    // Действия с папкой
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
            Открыть
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

  const hasAutoMarks = order.notesSnapshot?.autoMarks && order.notesSnapshot.autoMarks.length > 0;
  const hasClientNotes = order.notesSnapshot?.clientNotes && order.notesSnapshot.clientNotes.length > 0;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg">
              Заказ #{order.orderId.slice(0, 8)}
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {order.client?.name || 'Клиент не указан'}
              </span>
              <OrderStatusBadge status={order.status} />
              <ColorModeBadge colorMode={order.colorMode} />
            </div>
          </div>
          <div className="flex gap-2">
            {renderActions()}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Автоматические пометки */}
          {hasAutoMarks && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground">
                Автоматические пометки:
              </div>
              <div className="flex flex-wrap gap-2">
                {order.notesSnapshot.autoMarks.map((mark, idx) => (
                  <AutoMarkBadge key={idx} mark={mark} />
                ))}
              </div>
            </div>
          )}

          {/* Клиентские настройки */}
          {hasClientNotes && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground">
                Технологические настройки клиента:
              </div>
              <div className="text-sm bg-muted p-2 rounded-md">
                <ul className="list-disc list-inside space-y-1">
                  {order.notesSnapshot.clientNotes.map((note, idx) => (
                    <li key={idx} className="text-foreground">{note}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Информация о времени */}
          <div className="text-xs text-muted-foreground flex justify-between">
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
// src/client/components/orders/OrderCard.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Order, ColorMode } from "@/types";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { ColorModeBadge } from "./ColorModeBadge";
import { Button } from "@/components/ui/button";
import { FileText, FolderOpen, AlertTriangle, CheckCircle } from "lucide-react";
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

    // Действия согласно матрице действий (раздел 11)
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

    // Действия с папкой согласно разделу 6
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

  // Извлекаем данные из notesSnapshot согласно спецификации
  const hasAutoMarks = order.notesSnapshot?.automatedNotes && order.notesSnapshot.automatedNotes.length > 0;
  const hasClientNotes = order.notesSnapshot?.clientTechNotes && order.notesSnapshot.clientTechNotes.length > 0;

  // Проверяем MULTICOLOR заказ для особого отображения
  const isMulticolor = order.colorMode === 'MULTICOLOR';
  const isBlack = order.colorMode === 'BLACK';

  return (
    <Card className={`hover:shadow-lg transition-shadow ${isMulticolor ? 'border-yellow-200 border-2' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              Заказ #{order.id.slice(0, 8)}
              {isMulticolor && (
                <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  MULTICOLOR
                </Badge>
              )}
              {isBlack && (
                <Badge variant="secondary" className="text-gray-600">
                  BLACK
                </Badge>
              )}
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
          {/* Обязательная контрольная пометка для MULTICOLOR (раздел 3.5) */}
          {isMulticolor && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-yellow-800">Контрольная пометка:</div>
                  <div className="text-sm text-yellow-700 font-semibold">
                    Overprint control
                  </div>
                  <div className="text-xs text-yellow-600 mt-1">
                    Согласно спецификации: обязательно для контроля внимания оператора
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Автоматические пометки (раздел 5.4) */}
          {hasAutoMarks && !isMulticolor && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">
                Автоматические контрольные пометки:
              </div>
              <div className="flex flex-wrap gap-2">
                {order.notesSnapshot.automatedNotes.map((mark: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="text-sm font-normal">
                    ⚠️ {mark}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Клиентские технологические настройки (раздел 5) */}
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

          {/* Информация о времени */}
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
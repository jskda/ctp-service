// src/client/components/orders/OrderCard.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Order } from "@/types";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { Button } from "@/components/ui/button";
import { Package, Hash, Ruler, User, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useActivePlateTypes } from "@/hooks/usePlateTypes";
import { ProcessControlDialog } from './ProcessControlDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useRecordScrapClient,
  useRecordScrapProduction,
  useRecordScrapMaterial,
} from "@/hooks/usePlateMovements";

// Схема валидации для формы списания
const scrapFormSchema = z.object({
  scrapType: z.enum(["CLIENT", "PRODUCTION", "MATERIALS"]),
  quantity: z.coerce.number().int().min(1, "Минимум 1 пластина"),
  reason: z.string().optional(),
});

type ScrapFormValues = z.infer<typeof scrapFormSchema>;

interface OrderCardProps {
  order: Order;
  onAction: (action: string, orderId: string) => void;
}

export function OrderCard({ order, onAction }: OrderCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [scrapDialogOpen, setScrapDialogOpen] = useState(false);

  // Получаем типы пластин, чтобы найти ID по формату
  const { data: plateTypes } = useActivePlateTypes();
  const plateType = plateTypes?.find((pt) => pt.format === order.plateFormat);
  const plateTypeId = plateType?.id || "";

  // Мутации для разных типов брака
  const scrapClient = useRecordScrapClient();
  const scrapProduction = useRecordScrapProduction();
  const scrapMaterial = useRecordScrapMaterial();

  // Подсчитываем общее количество списанных в брак пластин для этого заказа
  const totalScrapped = order.plateMovements
    ?.filter((m) => m.reason.startsWith("SCRAP_"))
    .reduce((sum, m) => sum + Math.abs(m.quantity), 0) || 0;

  const hasClientNotes =
    order.notesSnapshot?.clientTechNotes &&
    order.notesSnapshot.clientTechNotes.length > 0;

  const handleAction = async (action: string) => {
    setIsLoading(true);
    try {
      await onAction(action, order.id);
    } finally {
      setIsLoading(false);
    }
  };

  // Форма для диалога списания
  const form = useForm<ScrapFormValues>({
    resolver: zodResolver(scrapFormSchema),
    defaultValues: {
      scrapType: "PRODUCTION",
      quantity: 1,
      reason: "",
    },
  });

  const onSubmitScrap = async (data: ScrapFormValues) => {
    if (!plateTypeId) {
      alert("Не найден тип пластины для данного формата");
      return;
    }
    try {
      const commonData = {
        plateTypeId,
        orderId: order.id,
        quantity: data.quantity,
        writeOffCount: data.quantity,
        reason: data.reason,
      };

      switch (data.scrapType) {
        case "CLIENT":
          await scrapClient.mutateAsync(commonData);
          break;
        case "PRODUCTION":
          await scrapProduction.mutateAsync(commonData);
          break;
        case "MATERIALS":
          await scrapMaterial.mutateAsync(commonData);
          break;
      }

      form.reset();
      setScrapDialogOpen(false);
      // После успешного списания обновляем список заказов (родительский компонент должен обновиться)
      // Можно вызвать onAction('refresh') или положиться на инвалидацию квери в хуках
    } catch (error: any) {
      alert(error.message || "Ошибка при фиксации брака");
    }
  };

  const isScrapLoading =
    scrapClient.isPending || scrapProduction.isPending || scrapMaterial.isPending;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg flex items-center gap-2">
            Заказ №{order.id.slice(0, 8)}
            {order.clientOrderNum && (
              <Badge variant="outline" className="text-xs font-normal">
                <Hash className="h-3 w-3 mr-1" />
                {order.clientOrderNum}
              </Badge>
            )}
          </CardTitle>
          <OrderStatusBadge status={order.status} />
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {/* Информационные блоки: клиент, формат, количество, списание */}
          <div className="grid grid-cols-4 gap-4 p-3 bg-muted/30 rounded-md">
            {/* Клиент */}
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Клиент</div>
                <div className="font-medium">{order.client?.name || "—"}</div>
              </div>
            </div>
            {/* Формат */}
            <div className="flex items-center gap-2">
              <Ruler className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Формат</div>
                <div className="font-medium">{order.plateFormat}</div>
              </div>
            </div>
            {/* Количество */}
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Пластин</div>
                <div className="font-medium">{order.totalPlates} шт.</div>
              </div>
            </div>
            {/* Списание */}
            <div className="flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Списание</div>
                <div className="font-medium">
                  {totalScrapped > 0 ? `${totalScrapped} шт.` : "—"}
                </div>
              </div>
            </div>
          </div>

          {/* Снапшот клиентских заметок */}
          {hasClientNotes && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">
                Технологические настройки (снапшот):
              </div>
              <div className="bg-blue-50 border border-blue-100 p-3 rounded-md">
                <ul className="space-y-1">
                  {order.notesSnapshot.clientTechNotes.map(
                    (note: string, idx: number) => (
                      <li
                        key={idx}
                        className="text-sm text-blue-800 flex items-start gap-2"
                      >
                        <span className="text-blue-500 mt-0.5 flex-shrink-0">
                          •
                        </span>
                        <span>{note}</span>
                      </li>
                    )
                  )}
                </ul>
                <div className="text-xs text-blue-600 mt-2">
                  Зафиксировано при создании заказа
                </div>
              </div>
            </div>
          )}

          {/* Даты и кнопки действий */}
          <div className="flex justify-between items-end pt-2">
            {order.status === "DONE" ? (
              <>
                <div className="text-xs text-muted-foreground">
                  Создан: {new Date(order.createdAt).toLocaleString("ru-RU")}
                </div>
                <div className="text-xs text-muted-foreground">
                  Завершён: {new Date(order.updatedAt).toLocaleString("ru-RU")}
                </div>
              </>
            ) : (
              <>
                <div className="text-xs text-muted-foreground">
                  Создан: {new Date(order.createdAt).toLocaleString("ru-RU")}
                  {order.updatedAt !== order.createdAt && (
                    <div>
                      Обновлён: {new Date(order.updatedAt).toLocaleString("ru-RU")}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {order.status === 'PROCESS' && (
  <>
    <ProcessControlDialog orderId={order.id} />
    <Button variant="outline" size="sm" onClick={() => setScrapDialogOpen(true)}>
      <Trash2 className="h-4 w-4 mr-2" />
      Списать брак
    </Button>
    <Button
      size="sm"
      variant="outline"
      onClick={() => handleAction('complete')}
      disabled={isLoading}
    >
      Завершить заказ
    </Button>
  </>
)}
                  {order.status === "NEW" && (
                    <Button
                      size="sm"
                      onClick={() => handleAction("start-processing")}
                      disabled={isLoading}
                    >
                      В работу (RIP + вывод)
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>

      {/* Диалог списания брака */}
      <Dialog open={scrapDialogOpen} onOpenChange={setScrapDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Списание бракованных пластин</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitScrap)} className="space-y-4">
              <div className="p-3 bg-muted rounded-md text-sm">
                Формат пластин:{" "}
                <span className="font-medium">{order.plateFormat}</span>
              </div>

              <FormField
                control={form.control}
                name="scrapType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Причина брака</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CLIENT">По вине клиента</SelectItem>
                        <SelectItem value="PRODUCTION">По вине производства</SelectItem>
                        <SelectItem value="MATERIALS">По вине материалов</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Количество забракованных пластин</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Примечание (опционально)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Дополнительная информация..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setScrapDialogOpen(false)}
                >
                  Отмена
                </Button>
                <Button type="submit" disabled={isScrapLoading}>
                  {isScrapLoading ? "Сохранение..." : "Зафиксировать"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
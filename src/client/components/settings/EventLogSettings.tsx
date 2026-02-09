import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEventLogSettings, useUpdateEventLogSettings } from '@/hooks/useSettings';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Database, Clock } from 'lucide-react';

const eventLogSettingsSchema = z.object({
  retentionDays: z.coerce.number().min(1, 'Минимум 1 день').max(3650, 'Максимум 10 лет'),
  logLevel: z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR']),
  enabledEventTypes: z.array(z.string()),
});

type EventLogSettingsForm = z.infer<typeof eventLogSettingsSchema>;

const EVENT_TYPES = [
  { id: 'order.created', label: 'Создание заказа' },
  { id: 'order.updated', label: 'Обновление заказа' },
  { id: 'order.status_changed', label: 'Изменение статуса заказа' },
  { id: 'plate.movement', label: 'Движение пластины' },
  { id: 'plate.stock_low', label: 'Низкий остаток пластины' },
  { id: 'user.login', label: 'Вход пользователя' },
  { id: 'system.error', label: 'Системная ошибка' },
];

export function EventLogSettings() {
  const { data: settings, isLoading } = useEventLogSettings();
  const updateMutation = useUpdateEventLogSettings();

  const form = useForm<EventLogSettingsForm>({
    resolver: zodResolver(eventLogSettingsSchema),
    values: settings || {
      retentionDays: 90,
      logLevel: 'INFO',
      enabledEventTypes: EVENT_TYPES.map(t => t.id),
    },
  });

  const onSubmit = async (data: EventLogSettingsForm) => {
    await updateMutation.mutateAsync(data);
  };

  return (
    <TabsContent value="events" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6" />
            Лог событий
          </CardTitle>
          <CardDescription>
            Настройка журналирования событий системы
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertDescription>
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Важно!</p>
                  <p className="text-sm">
                    События старше указанного периода будут автоматически удаляться для экономии места.
                  </p>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="retentionDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Период хранения (дней)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="3650"
                        placeholder="90"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      События старше этого периода будут автоматически удалены
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="logLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Уровень логирования</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="DEBUG">
                          <div>
                            <div className="font-medium">DEBUG</div>
                            <div className="text-xs text-muted-foreground">
                              Все события, включая отладочные
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="INFO">
                          <div>
                            <div className="font-medium">INFO</div>
                            <div className="text-xs text-muted-foreground">
                              Основные операции и информационные сообщения
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="WARN">
                          <div>
                            <div className="font-medium">WARN</div>
                            <div className="text-xs text-muted-foreground">
                              Предупреждения и нестандартные ситуации
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="ERROR">
                          <div>
                            <div className="font-medium">ERROR</div>
                            <div className="text-xs text-muted-foreground">
                              Только ошибки и критические события
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Минимальный уровень событий для записи в лог
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="enabledEventTypes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Типы событий для логирования</FormLabel>
                    <div className="space-y-2">
                      {EVENT_TYPES.map((eventType) => {
                        const isChecked = field.value?.includes(eventType.id);
                        return (
                          <div key={eventType.id} className="flex items-start space-x-2">
                            <Checkbox
                              id={eventType.id}
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  field.onChange([...(field.value || []), eventType.id]);
                                } else {
                                  field.onChange(
                                    (field.value || []).filter((v) => v !== eventType.id)
                                  );
                                }
                              }}
                            />
                            <div className="grid gap-1.5 leading-none">
                              <label
                                htmlFor={eventType.id}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {eventType.label}
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <FormDescription>
                      Выберите типы событий, которые нужно записывать в лог
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Сохранение...' : 'Сохранить изменения'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
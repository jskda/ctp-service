// src/client/components/settings/SystemSettings.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSystemSettings, useUpdateSystemSettings } from '@/hooks/useSettings';
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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { TabsContent } from '@/components/ui/tabs';

const systemSettingsSchema = z.object({
  companyName: z.string().min(1, 'Название компании обязательно'),
  currency: z.string().min(1, 'Валюта обязательна'),
  autoArchiveDays: z.coerce.number().min(1, 'Минимум 1 день').max(365, 'Максимум 365 дней'),
  enableNotifications: z.boolean(),
});

type SystemSettingsForm = z.infer<typeof systemSettingsSchema>;

export function SystemSettings() {
  const { data: settings, isLoading, error } = useSystemSettings();
  const updateMutation = useUpdateSystemSettings();

  const form = useForm<SystemSettingsForm>({
    resolver: zodResolver(systemSettingsSchema),
    values: settings || {
      companyName: '',
      currency: 'RUB',
      autoArchiveDays: 30,
      enableNotifications: true,
    },
  });

  const onSubmit = async (data: SystemSettingsForm) => {
    await updateMutation.mutateAsync(data);
  };

  if (isLoading) {
    return (
      <TabsContent value="system">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Загрузка настроек...</p>
          </CardContent>
        </Card>
      </TabsContent>
    );
  }

  if (error) {
    return (
      <TabsContent value="system">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Ошибка загрузки настроек: {(error as Error).message}
          </AlertDescription>
        </Alert>
      </TabsContent>
    );
  }

  return (
    <TabsContent value="system" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Системные настройки</CardTitle>
          <CardDescription>
            Общие параметры системы и компании
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Название компании *</FormLabel>
                    <FormControl>
                      <Input placeholder="Введите название компании" {...field} />
                    </FormControl>
                    <FormDescription>
                      Отображается в отчётах и документах
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Валюта *</FormLabel>
                    <FormControl>
                      <Input placeholder="RUB" {...field} />
                    </FormControl>
                    <FormDescription>
                      Валюта для финансовых операций
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="autoArchiveDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Дней до архивации</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="365"
                        placeholder="30"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Количество дней после завершения заказа до его архивации
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="enableNotifications"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Уведомления</FormLabel>
                    <FormControl>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="enableNotifications"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor="enableNotifications" className="text-sm font-medium">
                          Включить системные уведомления
                        </label>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Показывать уведомления о важных событиях в системе
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
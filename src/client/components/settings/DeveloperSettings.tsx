import { useState, useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDeveloperStatus, useDeveloperHistory, useReplaceDeveloper } from '@/hooks/useDeveloper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Droplet, RefreshCw, History } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const replaceSchema = z.object({
  volumeLiters: z.coerce.number().positive('Объём должен быть > 0'),
  concentrateName: z.string().optional(),
  concentrateRatio: z.string().optional(),
  maxAreaSqm: z.coerce.number().positive().optional(),
  notes: z.string().optional(),
});

type ReplaceForm = z.infer<typeof replaceSchema>;

export function DeveloperSettings() {
  const { data: currentStatus, isLoading: statusLoading, refetch: refetchStatus } = useDeveloperStatus();
  const { data: history, isLoading: historyLoading, refetch: refetchHistory } = useDeveloperHistory();
  const replaceMutation = useReplaceDeveloper();

  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<ReplaceForm>({
    resolver: zodResolver(replaceSchema),
    defaultValues: {
      volumeLiters: 42,
      concentrateName: 'Chembyo Plate DEV',
      concentrateRatio: '1:5',
      maxAreaSqm: undefined,
      notes: '',
    },
  });

  const onSubmit = async (data: ReplaceForm) => {
    await replaceMutation.mutateAsync(data);
    setDialogOpen(false);
    form.reset();
    refetchStatus();
    refetchHistory();
  };

  const volumeId = useId();
  const concentrateNameId = useId();
  const concentrateRatioId = useId();
  const maxAreaId = useId();
  const notesId = useId();

  return (
    <TabsContent value="developer" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplet className="h-6 w-6" />
            Управление проявителем
          </CardTitle>
          <CardDescription>
            Отслеживание ресурса проявителя, замена и история
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Текущая партия</h3>
              {statusLoading ? (
                <div>Загрузка...</div>
              ) : currentStatus ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Дата заливки:</span>
                    <p className="font-medium">
                      {format(new Date(currentStatus.startedAt), 'dd.MM.yyyy HH:mm')}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Объём раствора:</span>
                    <p className="font-medium">{currentStatus.volumeLiters} л</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Концентрат:</span>
                    <p className="font-medium">{currentStatus.concentrateName || '—'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Обработано площади:</span>
                    <p className="font-medium">
                      {currentStatus.totalArea} м²
                      {currentStatus.maxAreaSqm && ` / ${currentStatus.maxAreaSqm} м²`}
                    </p>
                  </div>
                  {currentStatus.usagePercent !== null && (
                    <div>
                      <span className="text-sm text-muted-foreground">Использование:</span>
                      <p className="font-medium">{currentStatus.usagePercent}%</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm text-muted-foreground">Отклонение растра:</span>
                    <p className="font-medium">
                      75%: {currentStatus.rasterDeviation?.avg75.toFixed(1)}% / 80%:{' '}
                      {currentStatus.rasterDeviation?.avg80.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertDescription>Нет активной партии проявителя. Выполните замену.</AlertDescription>
                </Alert>
              )}

              <div className="mt-4">
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Заменить проявитель
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Замена проявителя</DialogTitle>
                      <DialogDescription>
                        Укажите параметры новой партии проявителя. Текущая партия будет автоматически завершена.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="volumeLiters"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel htmlFor={volumeId}>Объём рабочего раствора (л) *</FormLabel>
                              <FormControl>
                                <Input id={volumeId} type="number" step="0.1" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="concentrateName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel htmlFor={concentrateNameId}>Название концентрата</FormLabel>
                              <FormControl>
                                <Input id={concentrateNameId} placeholder="Chembyo Plate DEV" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="concentrateRatio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel htmlFor={concentrateRatioId}>Соотношение (концентрат:вода)</FormLabel>
                              <FormControl>
                                <Input id={concentrateRatioId} placeholder="1:5" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="maxAreaSqm"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel htmlFor={maxAreaId}>Паспортная площадь обработки (м²)</FormLabel>
                              <FormControl>
                                <Input
                                  id={maxAreaId}
                                  type="number"
                                  step="0.1"
                                  placeholder="например, 5000"
                                  {...field}
                                  value={field.value ?? ''}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value ? Number(e.target.value) : undefined
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel htmlFor={notesId}>Примечания</FormLabel>
                              <FormControl>
                                <Textarea id={notesId} {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <DialogFooter>
                          <Button type="submit" disabled={replaceMutation.isPending}>
                            {replaceMutation.isPending ? 'Сохранение...' : 'Зафиксировать замену'}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <History className="h-4 w-4" />
                История замен
              </h3>
              {historyLoading ? (
                <div>Загрузка...</div>
              ) : !history || history.length === 0 ? (
                <div className="text-muted-foreground">Нет данных</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Дата начала</TableHead>
                      <TableHead>Дата окончания</TableHead>
                      <TableHead>Объём (л)</TableHead>
                      <TableHead>Концентрат</TableHead>
                      <TableHead>Площадь (м²)</TableHead>
                      <TableHead>Заказов</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((batch) => (
                      <TableRow key={batch.id}>
                        <TableCell>
                          {format(new Date(batch.startedAt), 'dd.MM.yyyy HH:mm')}
                        </TableCell>
                        <TableCell>
                          {batch.endedAt
                            ? format(new Date(batch.endedAt), 'dd.MM.yyyy HH:mm')
                            : 'Активна'}
                        </TableCell>
                        <TableCell>{batch.volumeLiters}</TableCell>
                        <TableCell>{batch.concentrateName || '—'}</TableCell>
                        <TableCell>{batch.totalArea}</TableCell>
                        <TableCell>{batch.orderCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
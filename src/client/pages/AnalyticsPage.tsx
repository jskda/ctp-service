// src/client/pages/AnalyticsPage.tsx
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAnalyticsSummary, useProcessControls, usePlateFormats } from '@/hooks/useAnalytics';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export function AnalyticsPage() {
  const today = new Date();
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(today.getMonth() - 1);

  const [fromDate, setFromDate] = useState<string>(format(oneMonthAgo, 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState<string>(format(today, 'yyyy-MM-dd'));
  const [selectedFormat, setSelectedFormat] = useState<string>('all');

  const dateRange = {
    from: fromDate ? new Date(fromDate) : undefined,
    to: toDate ? new Date(toDate) : undefined,
  };

  const { data: summary, isLoading: summaryLoading } = useAnalyticsSummary({
    from: dateRange.from?.toISOString(),
    to: dateRange.to?.toISOString(),
  });

  const { data: controls, isLoading: controlsLoading } = useProcessControls({
    from: dateRange.from?.toISOString(),
    to: dateRange.to?.toISOString(),
    plateFormat: selectedFormat === 'all' ? undefined : selectedFormat,
  });

  const { data: formats } = usePlateFormats();

  const exportToCSV = () => {
    if (!controls || controls.length === 0) return;
    const headers = ['Дата', 'Заказ №', 'Клиент', 'Формат', 'Растр 75%', 'Растр 80%', 'Скорость', 'Температура'];
    const rows = controls.map(c => {
      const m75 = c.measurements?.find((m: any) => m.target === 75);
      const m80 = c.measurements?.find((m: any) => m.target === 80);
      return [
        format(new Date(c.createdAt), 'dd.MM.yyyy HH:mm'),
        c.orderId.slice(0, 8),
        c.order.client.name,
        c.order.plateFormat,
        m75?.actual ?? '-',
        m80?.actual ?? '-',
        c.speed ?? '-',
        c.temperature ?? '-',
      ];
    });
    const csvContent = [headers, ...rows].map(row => row.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `process_controls_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const chartData = controls?.map(c => {
    const m75 = c.measurements?.find((m: any) => m.target === 75);
    const m80 = c.measurements?.find((m: any) => m.target === 80);
    return {
      date: format(new Date(c.createdAt), 'dd.MM'),
      fullDate: format(new Date(c.createdAt), 'dd.MM.yyyy HH:mm'),
      '75% факт': m75?.actual,
      '80% факт': m80?.actual,
      скорость: c.speed,
      температура: c.temperature,
    };
  }).reverse() || [];

  const scrapData = summary ? [
    { name: 'Клиент', value: Math.abs(summary.scrap.CLIENT) },
    { name: 'Производство', value: Math.abs(summary.scrap.PRODUCTION) },
    { name: 'Материалы', value: Math.abs(summary.scrap.MATERIALS) },
  ] : [];

  const getForecastStatusBadge = () => {
    if (!summary) return null;
    switch (summary.forecast.status) {
      case 'normal':
        return <Badge variant="outline">В норме</Badge>;
      case 'warning':
        return <Badge variant="destructive">Требует внимания</Badge>;
      default:
        return <Badge variant="secondary">Нет данных</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Аналитика</h1>
          <p className="text-muted-foreground mt-2">
            Контроль процесса проявки, статистика и прогнозирование
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportToCSV} disabled={!controls || controls.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Экспорт CSV
          </Button>
        </div>
      </div>

      {/* Фильтры по дате */}
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <Label>Начало периода</Label>
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-auto"
          />
        </div>
        <div>
          <Label>Конец периода</Label>
          <Input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-auto"
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setFromDate(format(oneMonthAgo, 'yyyy-MM-dd'));
            setToDate(format(today, 'yyyy-MM-dd'));
          }}
        >
          Сбросить
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="process">Контроль процесса</TabsTrigger>
          <TabsTrigger value="history">История замеров</TabsTrigger>
        </TabsList>

        {/* Вкладка Обзор */}
        <TabsContent value="overview" className="space-y-6">
          {summaryLoading ? (
            <div className="text-center py-12">Загрузка сводки...</div>
          ) : summary ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Всего заказов</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summary.totalOrders}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Активных заказов</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summary.activeOrders}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Израсходовано пластин</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summary.totalUsedPlates}</div>
                  </CardContent>
                </Card>
                <Card className={summary.forecast.status === 'warning' ? 'border-yellow-500' : ''}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Состояние проявителя</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      {getForecastStatusBadge()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Отклонение 75%: {summary.forecast.avgDeviation75}% / 80%: {summary.forecast.avgDeviation80}%
                    </p>
                    {summary.forecast.status === 'warning' && (
                      <Alert variant="destructive" className="mt-2 p-2">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          Рекомендуется проверить проявитель
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Распределение брака по причинам</CardTitle>
                  <CardDescription>За выбранный период (количество пластин)</CardDescription>
                </CardHeader>
                <CardContent>
                  {scrapData.every(d => d.value === 0) ? (
                    <div className="text-center py-12 text-muted-foreground">Нет данных о браке</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={scrapData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#ef4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {summary.lastControl && (
                <Card>
                  <CardHeader>
                    <CardTitle>Последний контроль</CardTitle>
                    <CardDescription>
                      {format(new Date(summary.lastControl.createdAt), 'dd.MM.yyyy HH:mm')} — заказ №{summary.lastControl.orderId.slice(0, 8)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Растр 75%:</span>
                        <p className="font-medium">
                          {summary.lastControl.measurements?.find((m: any) => m.target === 75)?.actual ?? '—'}%
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Растр 80%:</span>
                        <p className="font-medium">
                          {summary.lastControl.measurements?.find((m: any) => m.target === 80)?.actual ?? '—'}%
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Скорость:</span>
                        <p className="font-medium">{summary.lastControl.speed ?? '—'} м/мин</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Температура:</span>
                        <p className="font-medium">{summary.lastControl.temperature ?? '—'} °C</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">Ошибка загрузки данных</div>
          )}
        </TabsContent>

        {/* Вкладка Контроль процесса */}
        <TabsContent value="process" className="space-y-6">
          <div className="flex items-center gap-4">
            <Select value={selectedFormat} onValueChange={setSelectedFormat}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Формат пластин" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все форматы</SelectItem>
                {formats?.map(f => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {controlsLoading && <span className="text-sm text-muted-foreground">Загрузка...</span>}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Динамика отклонений растра</CardTitle>
              <CardDescription>Целевые значения: 75% и 80%</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">Нет данных за выбранный период</div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[65, 85]} />
                    <Tooltip labelFormatter={(value, payload) => payload?.[0]?.payload?.fullDate || value} />
                    <Legend />
                    <Line type="monotone" dataKey="75% факт" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="80% факт" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey={() => 75} stroke="#3b82f6" strokeDasharray="5 5" strokeWidth={1} name="Цель 75%" />
                    <Line type="monotone" dataKey={() => 80} stroke="#10b981" strokeDasharray="5 5" strokeWidth={1} name="Цель 80%" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Скорость и температура проявки</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">Нет данных за выбранный период</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="скорость" stroke="#f59e0b" name="Скорость (м/мин)" />
                    <Line yAxisId="right" type="monotone" dataKey="температура" stroke="#ef4444" name="Температура (°C)" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Вкладка История замеров */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Все контрольные записи</CardTitle>
              <CardDescription>
                {controlsLoading ? 'Загрузка...' : `Всего записей: ${controls?.length || 0}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {controlsLoading ? (
                <div className="text-center py-12">Загрузка истории...</div>
              ) : !controls || controls.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">Нет контрольных записей</div>
              ) : (
                <div className="rounded-md border overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Дата</TableHead>
                        <TableHead>Заказ</TableHead>
                        <TableHead>Клиент</TableHead>
                        <TableHead>Формат</TableHead>
                        <TableHead>75% факт</TableHead>
                        <TableHead>80% факт</TableHead>
                        <TableHead>Скорость</TableHead>
                        <TableHead>Темп-ра</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {controls.map(ctrl => {
                        const m75 = ctrl.measurements?.find((m: any) => m.target === 75);
                        const m80 = ctrl.measurements?.find((m: any) => m.target === 80);
                        return (
                          <TableRow key={ctrl.id}>
                            <TableCell>{format(new Date(ctrl.createdAt), 'dd.MM.yy HH:mm')}</TableCell>
                            <TableCell>№{ctrl.orderId.slice(0, 8)}</TableCell>
                            <TableCell>{ctrl.order.client.name}</TableCell>
                            <TableCell>{ctrl.order.plateFormat}</TableCell>
                            <TableCell>{m75?.actual ?? '-'}</TableCell>
                            <TableCell>{m80?.actual ?? '-'}</TableCell>
                            <TableCell>{ctrl.speed ?? '-'}</TableCell>
                            <TableCell>{ctrl.temperature ?? '-'}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
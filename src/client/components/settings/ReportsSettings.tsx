import { useState } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Download, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import { FileSpreadsheet } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function ReportsSettings() {
  const now = new Date();
  const [exportMonth, setExportMonth] = useState<string>(format(now, 'yyyy-MM'));

  // Генерируем список последних 12 месяцев
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return {
      value: format(d, 'yyyy-MM'),
      label: format(d, 'LLLL yyyy', { locale: ru }),
    };
  });

  const handleExport = () => {
    const [year, month] = exportMonth.split('-');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const url = `${apiUrl}/api/orders/export?year=${year}&month=${month}`;
    window.open(url, '_blank');
  };

  return (
    <TabsContent value="reports" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Экспорт данных</CardTitle>
          <CardDescription>
            Скачайте отчёт по заказам за выбранный месяц для бухгалтерии
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Месяц</label>
              <Select value={exportMonth} onValueChange={setExportMonth}>
                <SelectTrigger className="w-[220px]">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleExport}>
  <FileSpreadsheet className="mr-2 h-4 w-4" />
  Скачать Excel
</Button>
          </div>
          <p className="text-sm text-muted-foreground">
            В отчёт войдут поля: Дата, Номер заказа, Клиент, Формат, Количество пластин, Списания.
          </p>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
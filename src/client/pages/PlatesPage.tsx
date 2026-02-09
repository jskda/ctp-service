import { useState } from 'react';
import { usePlateTypes } from '@/hooks/usePlateTypes';
import { usePlateTypeThresholds } from '@/hooks/useSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PlatesPage() {
  const { data: plateTypes, isLoading } = usePlateTypes();
  const { data: thresholds } = usePlateTypeThresholds();
  
  const [editingId, setEditingId] = useState<string | null>(null);

  const getStockInfo = (plateTypeId: string) => {
    if (!thresholds) return { current: 0, threshold: 0, isLow: false };
    
    const threshold = thresholds.find(t => t.plateTypeId === plateTypeId);
    if (!threshold) return { current: 0, threshold: 0, isLow: false };
    
    return {
      current: threshold.currentStock,
      threshold: threshold.minStockThreshold,
      isLow: threshold.currentStock < threshold.minStockThreshold,
    };
  };

  if (isLoading) {
    return (
      <div className="p-4 flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Загрузка типов пластин...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Типы пластин</h1>
          <p className="text-muted-foreground mt-2">
            Управление типами пластин и контроль остатков
          </p>
        </div>
        <Button disabled>
          <Plus className="mr-2 h-4 w-4" />
          Добавить тип
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Список типов пластин</CardTitle>
          <CardDescription>
            Текущие типы пластин и их остатки на складе
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Формат</TableHead>
                  <TableHead>Производитель</TableHead>
                  <TableHead>Текущий остаток</TableHead>
                  <TableHead>Мин. остаток</TableHead>
                  <TableHead>Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plateTypes && plateTypes.length > 0 ? (
                  plateTypes.map((plateType) => {
                    const stockInfo = getStockInfo(plateType.id);
                    return (
                      <TableRow key={plateType.id}>
                        <TableCell className="font-medium">
                          {plateType.format}
                        </TableCell>
                        <TableCell>{plateType.manufacturer}</TableCell>
                        <TableCell className={stockInfo.isLow ? 'text-destructive font-semibold' : ''}>
                          {stockInfo.current}
                        </TableCell>
                        <TableCell>{stockInfo.threshold}</TableCell>
                        <TableCell>
                          {stockInfo.isLow ? (
                            <Badge variant="destructive">Дефицит</Badge>
                          ) : (
                            <Badge variant="outline">В норме</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Нет данных о типах пластин
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
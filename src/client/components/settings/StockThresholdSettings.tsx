import { useState } from 'react';
import { Save, X, AlertTriangle } from 'lucide-react';
import { usePlateTypeThresholds, useUpdatePlateThreshold } from '@/hooks/useSettings';
import { usePlateTypes } from '@/hooks/usePlateTypes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function StockThresholdSettings() {
  const { data: thresholds, isLoading } = usePlateTypeThresholds();
  const { data: plateTypes } = usePlateTypes();
  const updateMutation = useUpdatePlateThreshold();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [thresholdValue, setThresholdValue] = useState<number>(0);

  const handleEdit = (plateTypeId: string, currentValue: number) => {
    setEditingId(plateTypeId);
    setThresholdValue(currentValue);
  };

  const handleSave = async (plateTypeId: string) => {
    await updateMutation.mutateAsync({ plateTypeId, minStockThreshold: thresholdValue });
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setThresholdValue(0);
  };

  // Calculate current stock for each plate type
  const getStockInfo = (plateTypeId: string) => {
    const threshold = thresholds?.find(t => t.plateTypeId === plateTypeId);
    if (!threshold) return { current: 0, threshold: 0, isLow: false };
    
    return {
      current: threshold.currentStock,
      threshold: threshold.minStockThreshold,
      isLow: threshold.currentStock < threshold.minStockThreshold,
    };
  };

  return (
    <TabsContent value="stock" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            Пороги остатков
          </CardTitle>
          <CardDescription>
            Настройка минимальных остатков для автоматического контроля запасов
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertDescription>
              Когда остаток пластины падает ниже установленного порога, система покажет предупреждение
            </AlertDescription>
          </Alert>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Тип пластины</TableHead>
                  <TableHead>Формат</TableHead>
                  <TableHead>Производитель</TableHead>
                  <TableHead className="text-center">Текущий остаток</TableHead>
                  <TableHead className="text-center">Мин. остаток</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plateTypes?.map((plateType) => {
                  const stockInfo = getStockInfo(plateType.id);
                  const isEditing = editingId === plateType.id;
                  
                  return (
                    <TableRow key={plateType.id}>
                      <TableCell className="font-medium">
                        {plateType.format} ({plateType.manufacturer})
                      </TableCell>
                      <TableCell>{plateType.format}</TableCell>
                      <TableCell>{plateType.manufacturer}</TableCell>
                      <TableCell className="text-center">
                        <span className={stockInfo.isLow ? 'text-destructive font-semibold' : ''}>
                          {stockInfo.current}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={thresholdValue}
                              onChange={(e) => setThresholdValue(Number(e.target.value))}
                              min="0"
                              className="w-24"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleSave(plateType.id)}
                              disabled={updateMutation.isPending}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleCancel}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <span className={stockInfo.isLow ? 'text-destructive font-semibold' : ''}>
                            {stockInfo.threshold}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!isEditing && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(plateType.id, stockInfo.threshold)}
                          >
                            Изменить
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
// src/client/pages/PlatesPage.tsx
import { useState, useEffect } from 'react';
import { usePlateTypes, useCreatePlateType, useUpdatePlateType, useArchivePlateType } from '@/hooks/usePlateTypes';
import { usePlateTypeThresholds } from '@/hooks/useSettings';
import { useRecordPurchase, useRecordReturn, useRecordCorrection } from '@/hooks/usePlateMovements';
import { PlateType } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Edit, Save, X, Plus, Archive, AlertCircle, Package, ShoppingCart, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

export function PlatesPage() {
  const { data: plateTypes, isLoading, refetch: refetchPlateTypes } = usePlateTypes();
  const { data: thresholds, refetch: refetchThresholds } = usePlateTypeThresholds();
  const createMutation = useCreatePlateType();
  const updateMutation = useUpdatePlateType();
  const archiveMutation = useArchivePlateType();
  const purchaseMutation = useRecordPurchase();
  const returnMutation = useRecordReturn();
  const correctionMutation = useRecordCorrection();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ format: '', manufacturer: '', minStockThreshold: 0 });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newPlateType, setNewPlateType] = useState({ format: '', manufacturer: '', minStockThreshold: 0 });
  const [error, setError] = useState<string | null>(null);
  
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [correctionDialogOpen, setCorrectionDialogOpen] = useState(false);
  const [selectedPlateType, setSelectedPlateType] = useState<PlateType | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [correctionQuantity, setCorrectionQuantity] = useState<number>(0);

  // Обновляем данные после изменений
  const refreshData = async () => {
    await refetchPlateTypes();
    await refetchThresholds();
  };

  useEffect(() => {
    refreshData();
  }, []);

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

  const handleEdit = (plateType: PlateType) => {
    setEditingId(plateType.id);
    setFormData({
      format: plateType.format,
      manufacturer: plateType.manufacturer,
      minStockThreshold: plateType.minStockThreshold,
    });
  };

  const handleSave = async (id: string) => {
    if (!formData.format.trim() || !formData.manufacturer.trim()) {
      setError('Формат и производитель обязательны');
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id,
        data: {
          format: formData.format.trim(),
          manufacturer: formData.manufacturer.trim(),
          minStockThreshold: formData.minStockThreshold,
        },
      });
      setEditingId(null);
      setError(null);
      await refreshData();
    } catch (err: any) {
      setError(err.message || 'Ошибка сохранения');
    }
  };

  const handleCreate = async () => {
    if (!newPlateType.format.trim() || !newPlateType.manufacturer.trim()) {
      setError('Формат и производитель обязательны');
      return;
    }
    try {
      await createMutation.mutateAsync({
        format: newPlateType.format.trim(),
        manufacturer: newPlateType.manufacturer.trim(),
        minStockThreshold: newPlateType.minStockThreshold,
      });
      setCreateDialogOpen(false);
      setNewPlateType({ format: '', manufacturer: '', minStockThreshold: 0 });
      setError(null);
      await refreshData();
    } catch (err: any) {
      setError(err.message || 'Ошибка создания');
    }
  };

  const handleArchive = async (id: string, name: string) => {
    if (confirm(`Архивировать тип пластины "${name}"? Он не будет доступен для новых движений, но останется в истории.`)) {
      try {
        await archiveMutation.mutateAsync(id);
        await refreshData();
      } catch (err: any) {
        alert(err.message || 'Нельзя архивировать тип пластины, по которому есть движения');
      }
    }
  };

  const handlePurchase = async () => {
    if (!selectedPlateType || quantity <= 0) return;
    try {
      await purchaseMutation.mutateAsync({
        plateTypeId: selectedPlateType.id,
        quantity,
      });
      setPurchaseDialogOpen(false);
      setQuantity(1);
      setSelectedPlateType(null);
      await refreshData();
    } catch (err: any) {
      alert(err.message || 'Ошибка при пополнении');
    }
  };

  const handleReturn = async () => {
    if (!selectedPlateType || quantity <= 0) return;
    try {
      await returnMutation.mutateAsync({
        plateTypeId: selectedPlateType.id,
        quantity,
      });
      setReturnDialogOpen(false);
      setQuantity(1);
      setSelectedPlateType(null);
      await refreshData();
    } catch (err: any) {
      alert(err.message || 'Ошибка при возврате');
    }
  };

  const handleCorrection = async () => {
    if (!selectedPlateType || correctionQuantity === 0) return;
    try {
      await correctionMutation.mutateAsync({
        plateTypeId: selectedPlateType.id,
        quantity: correctionQuantity,
      });
      setCorrectionDialogOpen(false);
      setCorrectionQuantity(0);
      setSelectedPlateType(null);
      await refreshData();
    } catch (err: any) {
      alert(err.message || 'Ошибка при корректировке');
    }
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

  const activeTypes = plateTypes?.filter(p => p.isActive !== false) || [];
  const archivedTypes = plateTypes?.filter(p => p.isActive === false) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Учёт пластин</h1>
          <p className="text-muted-foreground mt-2">
            Управление остатками пластин. Поступление, возврат, корректировка.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Обновить
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Добавить тип
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Новый тип пластины</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div>
                  <label className="text-sm font-medium">Формат *</label>
                  <Input
                    value={newPlateType.format}
                    onChange={(e) => setNewPlateType({ ...newPlateType, format: e.target.value })}
                    placeholder="1030×800"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Производитель *</label>
                  <Input
                    value={newPlateType.manufacturer}
                    onChange={(e) => setNewPlateType({ ...newPlateType, manufacturer: e.target.value })}
                    placeholder="Kodak, Agfa, Fuji..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Минимальный остаток</label>
                  <Input
                    type="number"
                    value={newPlateType.minStockThreshold}
                    onChange={(e) => setNewPlateType({ ...newPlateType, minStockThreshold: Number(e.target.value) })}
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    При падении ниже этого уровня будет показано предупреждение
                  </p>
                </div>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Создание...' : 'Создать'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Активные типы пластин */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Остатки пластин
          </CardTitle>
          <CardDescription>Управление движением пластин: пополнение, возврат, корректировка</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Формат</TableHead>
                  <TableHead>Производитель</TableHead>
                  <TableHead className="text-center">Текущий остаток</TableHead>
                  <TableHead className="text-center">Мин. остаток</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeTypes.map((plateType) => {
                  const stockInfo = getStockInfo(plateType.id);
                  const isEditing = editingId === plateType.id;
                  return (
                    <TableRow key={plateType.id}>
                      <TableCell className="font-medium">
                        {isEditing ? (
                          <Input
                            value={formData.format}
                            onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                          />
                        ) : (
                          plateType.format
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={formData.manufacturer}
                            onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                          />
                        ) : (
                          plateType.manufacturer
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={stockInfo.isLow ? 'text-destructive font-semibold' : 'font-medium'}>
                          {stockInfo.current} шт.
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {isEditing ? (
                          <Input
                            type="number"
                            value={formData.minStockThreshold}
                            onChange={(e) => setFormData({ ...formData, minStockThreshold: Number(e.target.value) })}
                            className="w-24 text-center"
                          />
                        ) : (
                          <span className={stockInfo.isLow ? 'text-destructive font-semibold' : ''}>
                            {plateType.minStockThreshold} шт.
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {stockInfo.isLow ? (
                          <Badge variant="destructive">Дефицит</Badge>
                        ) : (
                          <Badge variant="outline">В норме</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {isEditing ? (
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" onClick={() => handleSave(plateType.id)}>
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-2 justify-end">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                setSelectedPlateType(plateType);
                                setPurchaseDialogOpen(true);
                              }}
                              title="Пополнить"
                            >
                              <ShoppingCart className="h-4 w-4 mr-1" />
                              +
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => {
                                setSelectedPlateType(plateType);
                                setReturnDialogOpen(true);
                              }}
                              title="Возврат"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => {
                                setSelectedPlateType(plateType);
                                setCorrectionDialogOpen(true);
                              }}
                              title="Корректировка"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEdit(plateType)}
                              title="Редактировать тип"
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleArchive(plateType.id, `${plateType.format} (${plateType.manufacturer})`)}
                              title="Архивировать"
                            >
                              <Archive className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {activeTypes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Нет активных типов пластин. Добавьте новый.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Диалог пополнения */}
      <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Пополнение пластин</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Тип пластины</Label>
              <div className="mt-1 p-2 bg-muted rounded-md">
                {selectedPlateType?.format} ({selectedPlateType?.manufacturer})
              </div>
            </div>
            <div>
              <Label>Количество *</Label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                placeholder="Количество пластин"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPurchaseDialogOpen(false)}>Отмена</Button>
            <Button onClick={handlePurchase} disabled={purchaseMutation.isPending || quantity <= 0}>
              {purchaseMutation.isPending ? 'Пополнение...' : 'Пополнить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог возврата */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Возврат пластин</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Тип пластины</Label>
              <div className="mt-1 p-2 bg-muted rounded-md">
                {selectedPlateType?.format} ({selectedPlateType?.manufacturer})
              </div>
            </div>
            <div>
              <Label>Количество *</Label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                placeholder="Количество пластин"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnDialogOpen(false)}>Отмена</Button>
            <Button onClick={handleReturn} disabled={returnMutation.isPending || quantity <= 0}>
              {returnMutation.isPending ? 'Оформление...' : 'Оформить возврат'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог корректировки */}
      <Dialog open={correctionDialogOpen} onOpenChange={setCorrectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Корректировка остатков</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Тип пластины</Label>
              <div className="mt-1 p-2 bg-muted rounded-md">
                {selectedPlateType?.format} ({selectedPlateType?.manufacturer})
              </div>
            </div>
            <div>
              <Label>Изменение количества *</Label>
              <Input
                type="number"
                value={correctionQuantity}
                onChange={(e) => setCorrectionQuantity(Number(e.target.value))}
                placeholder="Положительное или отрицательное число"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Положительное значение увеличит остаток, отрицательное — уменьшит
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCorrectionDialogOpen(false)}>Отмена</Button>
            <Button onClick={handleCorrection} disabled={correctionMutation.isPending || correctionQuantity === 0}>
              {correctionMutation.isPending ? 'Сохранение...' : 'Применить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Архивированные типы */}
      {archivedTypes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground">Архивированные типы</CardTitle>
            <CardDescription>Не участвуют в новых движениях, но остаются в истории</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Формат</TableHead>
                    <TableHead>Производитель</TableHead>
                    <TableHead className="text-center">Мин. остаток (исторический)</TableHead>
                    <TableHead>Дата архивации</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {archivedTypes.map((plateType) => (
                    <TableRow key={plateType.id}>
                      <TableCell className="text-muted-foreground">{plateType.format}</TableCell>
                      <TableCell className="text-muted-foreground">{plateType.manufacturer}</TableCell>
                      <TableCell className="text-center text-muted-foreground">{plateType.minStockThreshold} шт.</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {plateType.archivedAt ? new Date(plateType.archivedAt).toLocaleDateString() : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
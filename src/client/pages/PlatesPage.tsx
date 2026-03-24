import { useState } from 'react';
import { usePlateTypes, useCreatePlateType, useUpdatePlateType, useArchivePlateType } from '@/hooks/usePlateTypes';
import { usePlateTypeThresholds } from '@/hooks/useSettings';
import { PlateType } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Edit, Save, X, Plus, Archive, AlertCircle, Package } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

export function PlatesPage() {
  const { data: plateTypes, isLoading, refetch } = usePlateTypes();
  const { data: thresholds } = usePlateTypeThresholds();
  const createMutation = useCreatePlateType();
  const updateMutation = useUpdatePlateType();
  const archiveMutation = useArchivePlateType();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ format: '', manufacturer: '', minStockThreshold: 0 });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newPlateType, setNewPlateType] = useState({ format: '', manufacturer: '', minStockThreshold: 0 });
  const [error, setError] = useState<string | null>(null);

  const activeTypes = plateTypes?.filter(p => p.isActive !== false) || [];
  const archivedTypes = plateTypes?.filter(p => p.isActive === false) || [];

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
    } catch (err: any) {
      setError(err.message || 'Ошибка создания');
    }
  };

  const handleArchive = async (id: string, name: string) => {
    if (confirm(`Архивировать тип пластины "${name}"? Он не будет доступен для новых движений, но останется в истории.`)) {
      try {
        await archiveMutation.mutateAsync(id);
      } catch (err: any) {
        alert(err.message || 'Нельзя архивировать тип пластины, по которому есть движения');
      }
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Типы пластин</h1>
          <p className="text-muted-foreground mt-2">
            Справочник типов пластин. Архивированные типы не участвуют в новых движениях.
          </p>
        </div>
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

      {/* Активные типы пластин */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Активные типы
          </CardTitle>
          <CardDescription>Участвуют в учёте движения пластин</CardDescription>
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
                        <span className={stockInfo.isLow ? 'text-destructive font-semibold' : ''}>
                          {stockInfo.current}
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
                            {plateType.minStockThreshold}
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
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(plateType)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleArchive(plateType.id, `${plateType.format} (${plateType.manufacturer})`)}
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
                      <TableCell className="text-center text-muted-foreground">{plateType.minStockThreshold}</TableCell>
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
// src/client/pages/ClientsPage.tsx - полностью переписываем, убирая internalCode
import { useState } from 'react';
import { useClients, useCreateClient, useUpdateClient, useArchiveClient } from '@/hooks/useClients';
import { Client } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Edit, Save, X, Plus, Archive, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function ClientsPage() {
  const { data: clients, isLoading, refetch } = useClients();
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();
  const archiveMutation = useArchiveClient();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', techNotes: '' });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', techNotes: '' });
  const [error, setError] = useState<string | null>(null);

  const activeClients = clients?.filter(c => c.isActive !== false) || [];
  const archivedClients = clients?.filter(c => c.isActive === false) || [];

  const handleEdit = (client: Client) => {
    setEditingId(client.id);
    setFormData({
      name: client.name,
      techNotes: client.techNotes ? client.techNotes.join('\n') : '',
    });
  };

  const handleSave = async (clientId: string) => {
    try {
      const techNotes = formData.techNotes
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
      
      await updateMutation.mutateAsync({
        id: clientId,
        data: {
          name: formData.name,
          techNotes: techNotes.length > 0 ? techNotes : undefined,
        },
      });
      setEditingId(null);
      setError(null);
      await refetch();
    } catch (err: any) {
      setError(err.message || 'Ошибка сохранения');
    }
  };

  const handleCreate = async () => {
    if (!newClient.name.trim()) {
      setError('Название клиента обязательно');
      return;
    }
    try {
      const techNotes = newClient.techNotes
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
      
      await createMutation.mutateAsync({
        name: newClient.name.trim(),
        techNotes: techNotes.length > 0 ? techNotes : undefined,
      });
      setCreateDialogOpen(false);
      setNewClient({ name: '', techNotes: '' });
      setError(null);
      await refetch();
    } catch (err: any) {
      setError(err.message || 'Ошибка создания');
    }
  };

  const handleArchive = async (clientId: string, clientName: string) => {
    if (confirm(`Архивировать клиента "${clientName}"? Он не будет доступен для новых заказов, но останется в истории.`)) {
      try {
        await archiveMutation.mutateAsync(clientId);
        await refetch();
      } catch (err: any) {
        alert(err.message || 'Нельзя архивировать клиента с активными заказами');
      }
    }
  };

  if (isLoading) {
    return <div className="p-4 text-center">Загрузка клиентов...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Клиенты</h1>
          <p className="text-muted-foreground mt-2">
            Справочник клиентов. Архивированные клиенты не участвуют в новых заказах.
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Добавить клиента
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новый клиент</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div>
                <label className="text-sm font-medium">Название *</label>
                <Input
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  placeholder="ООО Полиграф"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Технические заметки</label>
                <Textarea
                  value={newClient.techNotes}
                  onChange={(e) => setNewClient({ ...newClient, techNotes: e.target.value })}
                  placeholder="По одной на строку&#10;Компенсация растискивания: +12%&#10;Пленка Agfa"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Эти настройки будут снэпшотиться в каждом новом заказе
                </p>
              </div>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Создание...' : 'Создать'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Активные клиенты */}
      <Card>
        <CardHeader>
          <CardTitle>Активные клиенты</CardTitle>
          <CardDescription>Участвуют в создании новых заказов</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Клиент</TableHead>
                <TableHead>Технические заметки</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeClients.map((client) => {
                const isEditing = editingId === client.id;
                return (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">
                      {isEditing ? (
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      ) : (
                        client.name
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Textarea
                          value={formData.techNotes}
                          onChange={(e) => setFormData({ ...formData, techNotes: e.target.value })}
                          rows={3}
                        />
                      ) : client.techNotes?.length > 0 ? (
                        <div className="space-y-1">
                          {client.techNotes.map((note: string, i: number) => (
                            <div key={i} className="text-sm bg-muted p-2 rounded">{note}</div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {isEditing ? (
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" onClick={() => handleSave(client.id)}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(client)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleArchive(client.id, client.name)}>
                            <Archive className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {activeClients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    Нет активных клиентов. Добавьте нового.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Архивированные клиенты */}
      {archivedClients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground">Архивированные клиенты</CardTitle>
            <CardDescription>Не участвуют в новых заказах, но остаются в истории</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Клиент</TableHead>
                  <TableHead>Дата архивации</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {archivedClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="text-muted-foreground">{client.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {client.archivedAt ? new Date(client.archivedAt).toLocaleDateString() : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
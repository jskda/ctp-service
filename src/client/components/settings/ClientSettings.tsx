// src/client/components/settings/ClientSettings.tsx
import { useState } from 'react';
import { Edit, Save, X, FileText, Hash } from 'lucide-react';
import { useClients } from '@/hooks/useClients';
import { useUpdateClient } from '@/hooks/useClients';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TabsContent } from '@/components/ui/tabs';

export function ClientSettings() {
  const { data: clients, isLoading } = useClients();
  const updateMutation = useUpdateClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    internalCode: '',
    techNotes: '',
  });

  const handleEdit = (clientId: string, clientName: string, internalCode?: string | null, techNotes?: string[]) => {
    setEditingId(clientId);
    setFormData({
      name: clientName,
      internalCode: internalCode || '',
      techNotes: techNotes ? techNotes.join('\n') : '',
    });
  };

  const handleSave = async (clientId: string) => {
    try {
      // Разбиваем текст на строки и фильтруем пустые
      const techNotes = formData.techNotes
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
      
      await updateMutation.mutateAsync({
        id: clientId,
        data: {
          name: formData.name,
          internalCode: formData.internalCode || null,
          techNotes: techNotes.length > 0 ? techNotes : undefined,
        },
      });
      setEditingId(null);
    } catch (error) {
      console.error('Error saving client:', error);
      alert('Ошибка при сохранении клиента');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ name: '', internalCode: '', techNotes: '' });
  };

  if (isLoading) {
    return (
      <TabsContent value="clients">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Загрузка клиентов...</p>
          </CardContent>
        </Card>
      </TabsContent>
    );
  }

  return (
    <TabsContent value="clients" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Настройки клиентов
          </CardTitle>
          <CardDescription>
            Управление данными клиентов, внутренними кодами и техническими заметками
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Клиент</TableHead>
                  <TableHead>Внутренний код</TableHead>
                  <TableHead>Технические заметки</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients?.map((client) => {
                  const isEditing = editingId === client.id;
                  return (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">
                        {isEditing ? (
                          <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Название клиента"
                          />
                        ) : (
                          client.name
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={formData.internalCode}
                            onChange={(e) => setFormData({ ...formData, internalCode: e.target.value })}
                            placeholder="Внутренний код клиента"
                            className="w-32"
                          />
                        ) : client.internalCode ? (
                          <span className="inline-flex items-center gap-1 text-sm font-mono">
                            <Hash className="h-3 w-3" />
                            {client.internalCode}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Textarea
                            value={formData.techNotes}
                            onChange={(e) => setFormData({ ...formData, techNotes: e.target.value })}
                            placeholder="Введите заметки, по одной на строку..."
                            className="font-sans text-sm"
                            rows={3}
                          />
                        ) : client.techNotes && client.techNotes.length > 0 ? (
                          <div className="space-y-1">
                            {client.techNotes.map((note, idx) => (
                              <div key={idx} className="text-sm bg-muted p-2 rounded">
                                {note}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {isEditing ? (
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              onClick={() => handleSave(client.id)}
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(client.id, client.name, client.internalCode, client.techNotes)}
                          >
                            <Edit className="h-4 w-4" />
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
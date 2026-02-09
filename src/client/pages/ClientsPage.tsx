import { useState } from 'react';
import { useClients } from '@/hooks/useClients';
import { useUpdateClient } from '@/hooks/useClients';
import { Client } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Edit, Save, X, FileText } from 'lucide-react';

export function ClientsPage() {
  const { data: clients, isLoading } = useClients();
  const updateMutation = useUpdateClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    techNotes: '',
  });

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
    } catch (error) {
      console.error('Error saving client:', error);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ name: '', techNotes: '' });
  };

  if (isLoading) {
    return (
      <div className="p-4 flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Загрузка клиентов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Клиенты</h1>
        <p className="text-muted-foreground mt-2">
          Справочник клиентов и их технологические настройки
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Список клиентов
          </CardTitle>
          <CardDescription>
            Управление данными клиентов и техническими заметками
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Клиент</TableHead>
                  <TableHead>Технические заметки</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients && clients.length > 0 ? (
                  clients.map((client) => {
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
                              onClick={() => handleEdit(client)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      Нет данных о клиентах
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
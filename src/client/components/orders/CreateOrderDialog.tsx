// src/client/components/orders/CreateOrderDialog.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Client, PlateType } from "@/types";
import { useActivePlateTypes } from "@/hooks/usePlateTypes";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const createOrderSchema = z.object({
  clientId: z.string().min(1, "Выберите клиента"),
  plateFormat: z.string().min(1, "Выберите формат пластин"),
  clientOrderNum: z.string().optional(),
  totalPlates: z.coerce.number().int().min(1, "Количество пластин должно быть не менее 1"),
});

type CreateOrderForm = z.infer<typeof createOrderSchema>;

interface CreateOrderDialogProps {
  clients: Client[];
  onCreate: (data: CreateOrderForm) => Promise<void>;
}

export function CreateOrderDialog({ clients, onCreate }: CreateOrderDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: plateTypes, isLoading: plateTypesLoading } = useActivePlateTypes();

  const form = useForm<CreateOrderForm>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      clientId: "",
      plateFormat: "",
      clientOrderNum: "",
      totalPlates: 1,
    },
  });

  const selectedPlateFormat = form.watch("plateFormat");
  const selectedPlateType = plateTypes?.find(p => p.format === selectedPlateFormat);
  const currentStock = selectedPlateType?.currentStock || 0;

  const handleSubmit = async (data: CreateOrderForm) => {
    setError(null);
    setIsLoading(true);
    try {
      // Проверяем наличие пластин перед отправкой
      if (currentStock < data.totalPlates) {
        throw new Error(`Недостаточно пластин формата ${data.plateFormat}. Доступно: ${currentStock}, требуется: ${data.totalPlates}`);
      }
      
      await onCreate(data);
      form.reset();
      setOpen(false);
    } catch (error: any) {
      console.error('Create order failed:', error);
      setError(error.message || 'Ошибка при создании заказа');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Создать заказ
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Создать новый заказ</DialogTitle>
          <DialogDescription>
            Заполните информацию о заказе. Пластины будут списаны сразу после создания заказа.
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Клиент *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите клиента" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="plateFormat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Формат пластин *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={plateTypesLoading ? "Загрузка..." : "Выберите формат пластин"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {plateTypes?.map((type) => (
                        <SelectItem key={type.id} value={type.format}>
                          {type.format} ({type.manufacturer}) - Доступно: {type.currentStock || 0} шт.
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Формат пластин, используемых для этого заказа. Пластины будут списаны со склада.
                  </FormDescription>
                  {selectedPlateFormat && selectedPlateType && (
                    <div className="text-sm mt-2 p-2 bg-muted rounded-md">
                      <span className="font-medium">Доступно на складе:</span>{' '}
                      <span className={currentStock >= form.watch("totalPlates") ? "text-green-600" : "text-red-600"}>
                        {currentStock} шт.
                      </span>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clientOrderNum"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Номер заказа клиента</FormLabel>
                  <FormControl>
                    <Input placeholder="Введите внутренний номер заказа клиента" {...field} />
                  </FormControl>
                  <FormDescription>
                    Внутренний номер заказа в системе клиента
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="totalPlates"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Всего пластин *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="1" 
                      placeholder="Количество пластин на заказ" 
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        // Проверяем достаточно ли пластин при изменении количества
                        if (selectedPlateType && Number(e.target.value) > currentStock) {
                          form.setError('totalPlates', {
                            type: 'manual',
                            message: `Недостаточно пластин. Доступно: ${currentStock} шт.`
                          });
                        } else {
                          form.clearErrors('totalPlates');
                        }
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Общее количество пластин, необходимое для заказа
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || (selectedPlateType && form.watch("totalPlates") > currentStock)}
            >
              {isLoading ? "Создание..." : "Создать заказ"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
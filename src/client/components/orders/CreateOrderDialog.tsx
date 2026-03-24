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
import { Client, ColorMode } from "@/types";

const createOrderSchema = z.object({
  clientId: z.string().min(1, "Выберите клиента"),
  colorMode: z.enum(['CMYK', 'BLACK', 'MULTICOLOR']),
  clientOrderNum: z.string().optional(),
  plateFormat: z.string().min(1, "Укажите формат пластин"),
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

  const form = useForm<CreateOrderForm>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      clientId: "",
      colorMode: "CMYK",
      clientOrderNum: "",
      plateFormat: "",
      totalPlates: 1,
    },
  });

  const handleSubmit = async (data: CreateOrderForm) => {
    setIsLoading(true);
    try {
      await onCreate(data);
      form.reset();
      setOpen(false);
    } catch (error) {
      console.error('Create order failed:', error);
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
            Заполните информацию о заказе
          </DialogDescription>
        </DialogHeader>
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
                          {client.name} {client.internalCode ? `(${client.internalCode})` : ''}
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
              name="plateFormat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Формат пластин *</FormLabel>
                  <FormControl>
                    <Input placeholder="Например: 1030×800" {...field} />
                  </FormControl>
                  <FormDescription>
                    Формат пластин, используемых для этого заказа
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
                    <Input type="number" min="1" placeholder="Количество пластин на заказ" {...field} />
                  </FormControl>
                  <FormDescription>
                    Общее количество пластин, необходимое для заказа
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="colorMode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Красочность *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="CMYK">CMYK</SelectItem>
                      <SelectItem value="BLACK">BLACK</SelectItem>
                      <SelectItem value="MULTICOLOR">MULTICOLOR</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Выберите режим красочности для заказа
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Создание..." : "Создать заказ"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
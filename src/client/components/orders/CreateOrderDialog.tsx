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
    },
  });

  const handleSubmit = async (data: CreateOrderForm) => {  // ← ИСПРАВЛЕНО: добавлен параметр data
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
      <DialogContent className="sm:max-w-[425px]">
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
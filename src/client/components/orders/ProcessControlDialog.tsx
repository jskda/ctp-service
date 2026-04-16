// src/client/components/orders/ProcessControlDialog.tsx
import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Gauge, Thermometer, Plus, Trash2 } from 'lucide-react';
import { useAddProcessControl } from '@/hooks/useOrders';

const measurementSchema = z.object({
  target: z.coerce.number().min(0).max(100),
  actual: z.coerce.number().min(0).max(100),
});

const schema = z.object({
  measurements: z.array(measurementSchema).default([]),
  speed: z.coerce.number().positive().optional(),
  temperature: z.coerce.number().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface ProcessControlDialogProps {
  orderId: string;
  disabled?: boolean;
}

export function ProcessControlDialog({ orderId, disabled }: ProcessControlDialogProps) {
  const [open, setOpen] = useState(false);
  const addControl = useAddProcessControl();

const form = useForm<FormValues>({
  resolver: zodResolver(schema),
  defaultValues: {
    measurements: [],   // пустой массив
    speed: undefined,
    temperature: undefined,
    notes: '',
  },
});

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'measurements',
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await addControl.mutateAsync({ orderId, data });
      form.reset();
      setOpen(false);
    } catch (error: any) {
      alert(error.message || 'Ошибка сохранения');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <Gauge className="h-4 w-4 mr-2" />
          Контроль проявки
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Параметры проявки</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Список замеров */}
            <div className="space-y-3">
  <FormLabel>Замеры растра</FormLabel>
  
  {fields.length === 0 ? (
    <p className="text-sm text-muted-foreground">Нет добавленных замеров</p>
  ) : (
    fields.map((field, index) => (
      <div key={field.id} className="flex items-center gap-2">
        <FormField
          control={form.control}
          name={`measurements.${index}.target`}
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <Input type="number" step="1" placeholder="Цель %" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <span>→</span>
        <FormField
          control={form.control}
          name={`measurements.${index}.actual`}
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Факт %"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => remove(index)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    ))
  )}

  <Button
    type="button"
    variant="outline"
    size="sm"
    onClick={() => append({ target: 75, actual: undefined })}
  >
    <Plus className="h-4 w-4 mr-1" />
    Добавить замер
  </Button>
</div>

            {/* Скорость */}
            <FormField
              control={form.control}
              name="speed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Gauge className="h-4 w-4" />
                    Скорость (м/мин)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="1.2"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Температура */}
            <FormField
              control={form.control}
              name="temperature"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Thermometer className="h-4 w-4" />
                    Температура (°C)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="23.5"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Примечание */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Примечание</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Дополнительная информация..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={addControl.isPending}>
                {addControl.isPending ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
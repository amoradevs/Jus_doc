'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const schema = z.object({
  data_cumprimento:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data obrigatória'),
  anotacao_cumprimento: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function toIsoToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

type Props = {
  prazoId: string;
  tipoPrazo: string;
  onCumprido: () => void;
};

export function CumprirModal({ prazoId, tipoPrazo, onCumprido }: Props) {
  const [open, setOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { data_cumprimento: toIsoToday() },
  });

  async function onSubmit(data: FormValues) {
    const res = await fetch(`/api/prazos/${prazoId}/cumprir`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      toast.success('Prazo marcado como cumprido.');
      reset({ data_cumprimento: toIsoToday() });
      setOpen(false);
      onCumprido();
      window.dispatchEvent(new CustomEvent('prazo-updated'));
    } else {
      const err = await res.json();
      toast.error(err?.error ?? 'Erro ao marcar prazo.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline font-medium">
          Marcar como cumprido
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Cumprimento de prazo</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground -mt-2">{tipoPrazo}</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="data_cumprimento">Data de cumprimento *</Label>
            <Input id="data_cumprimento" type="date" {...register('data_cumprimento')} />
            {errors.data_cumprimento && (
              <p className="text-xs text-destructive">{errors.data_cumprimento.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="anotacao_cumprimento">
              Anotação <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <textarea
              id="anotacao_cumprimento"
              rows={3}
              placeholder="O que foi feito, protocolo, etc..."
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              {...register('anotacao_cumprimento')}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="rounded-xl">
              {isSubmitting ? 'Salvando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { CATEGORIAS_PRAZO, TIPOS_SUGERIDOS, CATEGORIA_STYLE, type CategoriaPrazo } from '@/lib/prazos/categorias';
import { calcularDataLimite } from '@/lib/prazos/calcular-data-limite';

const schema = z.object({
  categoria:   z.enum(['administrativo_inss', 'judicial', 'comercial_interno', 'evento']),
  tipo:        z.string().min(1, 'Informe o tipo do prazo'),
  descricao:   z.string().optional(),
  data_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  data_limite: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data limite obrigatória'),
  dias_uteis:  z.boolean(),
});

type FormValues = z.infer<typeof schema>;

function toIsoToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

type Props = {
  processoId: string;
  onCriado: () => void;
};

export function NovoPrazoModal({ processoId, onCriado }: Props) {
  const [open, setOpen] = useState(false);
  const [diasCalculo, setDiasCalculo] = useState('');

  const hoje = toIsoToday();

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      categoria:   'administrativo_inss',
      data_inicio: hoje,
      dias_uteis:  false,
    },
  });

  const categoriaAtual = watch('categoria') as CategoriaPrazo;
  const dataInicio     = watch('data_inicio');
  const diasUteis      = watch('dias_uteis');
  const tiposDisponiveis = TIPOS_SUGERIDOS[categoriaAtual] ?? [];

  function aplicarSugestao(tipo: string, diasPadrao?: number, diasUteisPadrao?: boolean) {
    setValue('tipo', tipo);
    if (diasUteisPadrao !== undefined) setValue('dias_uteis', diasUteisPadrao);
    if (diasPadrao !== undefined) {
      setDiasCalculo(String(diasPadrao));
      const limit = calcularDataLimite(dataInicio || hoje, diasPadrao, diasUteisPadrao ?? false);
      setValue('data_limite', limit);
    }
  }

  function handleDiasChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setDiasCalculo(v);
    const n = parseInt(v);
    if (n > 0 && dataInicio) {
      const limit = calcularDataLimite(dataInicio, n, diasUteis);
      setValue('data_limite', limit);
    }
  }

  async function onSubmit(data: FormValues) {
    const res = await fetch(`/api/processos/${processoId}/prazos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      toast.success('Prazo cadastrado com sucesso.');
      reset({ categoria: 'administrativo_inss', data_inicio: hoje, dias_uteis: false });
      setDiasCalculo('');
      setOpen(false);
      onCriado();
    } else {
      const err = await res.json();
      toast.error(err?.error?.message ?? 'Erro ao salvar prazo.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="rounded-xl text-xs h-8">
          + Novo prazo
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo prazo</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* Categoria */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Categoria
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIAS_PRAZO.map((cat) => {
                const style = CATEGORIA_STYLE[cat.value as CategoriaPrazo];
                const ativo = categoriaAtual === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => {
                      setValue('categoria', cat.value as CategoriaPrazo);
                      // Ajusta dias_uteis default para judicial
                      if (cat.value === 'judicial') setValue('dias_uteis', true);
                      else setValue('dias_uteis', false);
                    }}
                    className={`text-left rounded-xl border px-3 py-2.5 transition-colors ${
                      ativo
                        ? `${style.bg} ${style.border} ${style.text}`
                        : 'border-border hover:bg-secondary/50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                      <span className="text-xs font-semibold">{cat.label}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-tight">{cat.descricao}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sugestões de tipo */}
          {tiposDisponiveis.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Sugestões rápidas</Label>
              <div className="flex flex-wrap gap-1.5">
                {tiposDisponiveis.map((s) => (
                  <button
                    key={s.tipo}
                    type="button"
                    onClick={() => aplicarSugestao(s.tipo, s.diasPadrao, s.diasUteis)}
                    className="text-xs border border-border rounded-lg px-2.5 py-1 hover:bg-secondary/50 transition-colors"
                  >
                    {s.tipo}{s.diasPadrao ? ` (${s.diasPadrao}d)` : ''}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tipo (text livre) */}
          <div className="space-y-1">
            <Label htmlFor="tipo">Tipo do prazo *</Label>
            <Input id="tipo" placeholder="Ex: Resposta a exigência" {...register('tipo')} />
            {errors.tipo && <p className="text-xs text-destructive">{errors.tipo.message}</p>}
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="data_inicio">Data de início</Label>
              <Input id="data_inicio" type="date" {...register('data_inicio')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dias_calculo">Calcular (dias)</Label>
              <Input
                id="dias_calculo"
                type="number"
                min="1"
                placeholder="Ex: 30"
                value={diasCalculo}
                onChange={handleDiasChange}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="dias_uteis"
              checked={diasUteis}
              onCheckedChange={(v) => {
                setValue('dias_uteis', !!v);
                const n = parseInt(diasCalculo);
                if (n > 0 && dataInicio) {
                  setValue('data_limite', calcularDataLimite(dataInicio, n, !!v));
                }
              }}
            />
            <Label htmlFor="dias_uteis" className="text-sm cursor-pointer">
              Contar em dias úteis (excl. fins de semana, feriados e recesso forense)
            </Label>
          </div>

          <div className="space-y-1">
            <Label htmlFor="data_limite">Data limite *</Label>
            <Input id="data_limite" type="date" {...register('data_limite')} />
            {errors.data_limite && (
              <p className="text-xs text-destructive">{errors.data_limite.message}</p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-1">
            <Label htmlFor="descricao">Descrição <span className="text-muted-foreground">(opcional)</span></Label>
            <textarea
              id="descricao"
              rows={2}
              placeholder="Detalhes adicionais sobre o prazo..."
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              {...register('descricao')}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="rounded-xl">
              {isSubmitting ? 'Salvando...' : 'Salvar prazo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

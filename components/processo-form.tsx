'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { processoSchema, type ProcessoInput } from '@/lib/validators/schemas';
import { TIPOS_BENEFICIO, STATUS_RESULTADO } from '@/lib/processo';
import { ETAPAS_PIPELINE } from '@/lib/pipeline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

type Props = {
  clienteId: string;
  clienteNome: string;
};

export function ProcessoForm({ clienteId, clienteNome }: Props) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProcessoInput>({
    resolver: zodResolver(processoSchema),
    defaultValues: {
      status_resultado: 'em_andamento',
      etapa_pipeline: 'triagem',
    },
  });

  const onSubmit = async (data: ProcessoInput) => {
    const res = await fetch('/api/processos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, cliente_id: clienteId }),
    });

    if (res.ok) {
      const json = await res.json();
      toast.success('Processo cadastrado com sucesso.');
      router.push(`/processos/${json.numero_interno}`);
    } else {
      const err = await res.json();
      toast.error(err?.error?.message ?? 'Erro ao cadastrar processo.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Tipo de benefício */}
      <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Dados do processo
        </h2>

        <div className="space-y-1">
          <Label htmlFor="tipo_beneficio">Tipo de benefício *</Label>
          <Select onValueChange={(v) => setValue('tipo_beneficio', v)}>
            <SelectTrigger id="tipo_beneficio">
              <SelectValue placeholder="Selecione o tipo..." />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_BENEFICIO.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.tipo_beneficio && (
            <p className="text-xs text-destructive">{errors.tipo_beneficio.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="status_resultado">Status</Label>
            <Select
              defaultValue="em_andamento"
              onValueChange={(v) => setValue('status_resultado', v)}
            >
              <SelectTrigger id="status_resultado">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_RESULTADO.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="etapa_pipeline">Etapa no pipeline</Label>
            <Select
              defaultValue="triagem"
              onValueChange={(v) => setValue('etapa_pipeline', v)}
            >
              <SelectTrigger id="etapa_pipeline">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ETAPAS_PIPELINE.map((e) => (
                  <SelectItem key={e.value} value={e.value}>
                    {e.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="data_entrada">Data de entrada</Label>
            <Input id="data_entrada" type="date" {...register('data_entrada')} />
            {errors.data_entrada && (
              <p className="text-xs text-destructive">{errors.data_entrada.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="dib_pleiteada">DIB pleiteada</Label>
            <Input id="dib_pleiteada" type="date" {...register('dib_pleiteada')} />
            {errors.dib_pleiteada && (
              <p className="text-xs text-destructive">{errors.dib_pleiteada.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Números de referência */}
      <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Referências externas
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="numero_protocolo_inss">Nº protocolo INSS</Label>
            <Input
              id="numero_protocolo_inss"
              placeholder="Ex: 1234567890"
              {...register('numero_protocolo_inss')}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="numero_processo_judicial">Nº processo judicial</Label>
            <Input
              id="numero_processo_judicial"
              placeholder="Ex: 0000000-00.0000.0.00.0000"
              {...register('numero_processo_judicial')}
            />
          </div>
        </div>
      </div>

      {/* Observação */}
      <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Observações
        </h2>
        <div className="space-y-1">
          <Label htmlFor="observacao_pipeline">Observação do pipeline</Label>
          <textarea
            id="observacao_pipeline"
            rows={3}
            placeholder="Notas internas sobre o andamento do processo..."
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 resize-none"
            {...register('observacao_pipeline')}
          />
        </div>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting} className="rounded-xl">
          {isSubmitting ? 'Cadastrando...' : 'Cadastrar processo'}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-xl border-border"
          onClick={() => router.push(`/clientes/${clienteId}`)}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}

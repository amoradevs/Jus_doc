'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ChevronDown } from 'lucide-react';
import { STATUS_RESULTADO } from '@/lib/processo';

const STYLE: Record<string, { badge: string; dot: string }> = {
  deferido:              { badge: 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100', dot: 'bg-emerald-500' },
  indeferido:            { badge: 'text-destructive bg-destructive/5 border-destructive/20 hover:bg-destructive/10', dot: 'bg-destructive' },
  exigencia:             { badge: 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100', dot: 'bg-amber-500' },
  recurso_administrativo:{ badge: 'text-violet-700 bg-violet-50 border-violet-200 hover:bg-violet-100', dot: 'bg-violet-500' },
  judicializado:         { badge: 'text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100', dot: 'bg-rose-500' },
  arquivado:             { badge: 'text-gray-600 bg-gray-50 border-gray-200 hover:bg-gray-100', dot: 'bg-gray-400' },
  em_andamento:          { badge: 'text-primary bg-primary/5 border-primary/20 hover:bg-primary/10', dot: 'bg-primary/60' },
};

type Props = { processoId: string; statusAtual: string };

export function AlterarStatusSelect({ processoId, statusAtual }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(statusAtual);
  const [isPending, startTransition] = useTransition();

  const s = STYLE[status] ?? STYLE.em_andamento;
  const label = STATUS_RESULTADO.find((x) => x.value === status)?.label ?? status;

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const novo = e.target.value;
    if (novo === status || isPending) return;
    const anterior = status;
    setStatus(novo); // optimistic
    startTransition(async () => {
      const res = await fetch(`/api/processos/${processoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status_resultado: novo }),
      });
      if (res.ok) {
        router.refresh();
        toast.success('Status atualizado.');
      } else {
        setStatus(anterior);
        toast.error('Erro ao atualizar status.');
      }
    });
  }

  return (
    <div className="relative inline-flex items-center">
      <span
        className={`inline-flex items-center gap-1 text-xs font-medium border rounded-full px-2.5 py-0.5 pr-6 cursor-pointer select-none transition-colors ${s.badge}`}
      >
        {isPending ? (
          <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin shrink-0" />
        ) : (
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
        )}
        {label}
      </span>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 opacity-50 pointer-events-none" />
      <select
        value={status}
        onChange={handleChange}
        disabled={isPending}
        className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
        aria-label="Alterar status do processo"
      >
        {STATUS_RESULTADO.map((op) => (
          <option key={op.value} value={op.value}>{op.label}</option>
        ))}
      </select>
    </div>
  );
}

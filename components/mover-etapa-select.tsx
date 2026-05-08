'use client';

import { useTransition } from 'react';
import { ETAPAS_PIPELINE } from '@/lib/pipeline';
import { moverEtapa } from '@/app/(app)/pipeline/actions';

export function MoverEtapaSelect({
  processoId,
  etapaAtual,
}: {
  processoId: string;
  etapaAtual: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <select
        value={etapaAtual}
        disabled={isPending}
        onChange={(e) => {
          const nova = e.target.value;
          if (nova !== etapaAtual) {
            startTransition(() => moverEtapa(processoId, nova));
          }
        }}
        className="h-9 rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60 transition-colors"
      >
        {ETAPAS_PIPELINE.map((e) => (
          <option key={e.value} value={e.value}>
            {e.label}
          </option>
        ))}
      </select>
      {isPending && (
        <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      )}
    </div>
  );
}

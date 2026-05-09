'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { encerrarProcesso } from '@/app/(app)/pipeline/actions';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

type Props = {
  processoId: string;
  numeroInterno: string;
};

export function EncerrarProcessoButton({ processoId, numeroInterno }: Props) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [isPending, startTransition] = useTransition();

  function confirmar() {
    startTransition(async () => {
      await encerrarProcesso(processoId);
      router.push('/pipeline');
    });
  }

  if (!confirmando) {
    return (
      <Button
        variant="outline"
        className="rounded-xl text-muted-foreground"
        onClick={() => setConfirmando(true)}
      >
        Encerrar processo
      </Button>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
      <p className="flex-1 text-sm text-amber-800 dark:text-amber-300">
        Encerrar o processo <strong>{numeroInterno}</strong>?
        Ele sairá do pipeline, mas ficará preservado no histórico.
      </p>
      <div className="flex gap-2 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="rounded-xl"
          onClick={() => setConfirmando(false)}
          disabled={isPending}
        >
          Cancelar
        </Button>
        <Button
          size="sm"
          className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white"
          onClick={confirmar}
          disabled={isPending}
        >
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          {isPending ? 'Encerrando…' : 'Confirmar encerramento'}
        </Button>
      </div>
    </div>
  );
}

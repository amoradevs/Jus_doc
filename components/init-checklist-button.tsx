'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { inicializarChecklist } from '@/app/(app)/pipeline/actions';
import { useRouter } from 'next/navigation';

interface InitChecklistButtonProps {
  clientId: string;
  tipoPedido: string | null;
}

export function InitChecklistButton({ clientId, tipoPedido }: InitChecklistButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleInit() {
    startTransition(async () => {
      await inicializarChecklist(clientId, tipoPedido);
      router.refresh();
    });
  }

  return (
    <Button
      onClick={handleInit}
      disabled={isPending}
      variant="outline"
      size="sm"
      className="rounded-lg border-border"
    >
      {isPending ? (
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Criando...
        </span>
      ) : (
        '📋 Iniciar checklist de documentos'
      )}
    </Button>
  );
}

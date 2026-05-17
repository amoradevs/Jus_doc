'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog';

type Props = {
  processoId: string;
  numeroInterno: string;
  clienteId: string;
};

export function DeleteProcessoButton({ processoId, numeroInterno, clienteId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleDelete() {
    const res = await fetch(`/api/processos/${processoId}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success(`Processo ${numeroInterno} excluído.`);
      router.push(`/clientes/${clienteId}`);
    } else {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? 'Erro ao excluir processo.');
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-destructive/60 hover:text-destructive hover:underline transition-colors"
      >
        Excluir processo
      </button>

      <DeleteConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Excluir processo ${numeroInterno}?`}
        description="Esta ação é permanente e não pode ser desfeita. Todos os prazos e documentos vinculados serão removidos."
        onConfirm={handleDelete}
      />
    </>
  );
}

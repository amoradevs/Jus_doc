'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog';

type Props = { clientId: string; clientName: string };

export function DeleteClientButton({ clientId, clientName }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleDelete() {
    const res = await fetch(`/api/clientes/${clientId}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Cliente excluído com sucesso.');
      router.push('/clientes');
    } else {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? 'Erro ao excluir cliente.');
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-destructive/70 hover:text-destructive hover:underline transition-colors"
      >
        Excluir cliente
      </button>

      <DeleteConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Excluir ${clientName}?`}
        description="Esta ação é permanente e não pode ser desfeita. Todos os processos, prazos e documentos vinculados serão removidos."
        onConfirm={handleDelete}
      />
    </>
  );
}

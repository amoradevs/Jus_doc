'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

type Props = { clientId: string; clientName: string };

export function DeleteClientButton({ clientId, clientName }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    const res = await fetch(`/api/clientes/${clientId}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Cliente excluído com sucesso.');
      router.push('/clientes');
    } else {
      toast.error('Erro ao excluir cliente. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-destructive/70 hover:text-destructive hover:underline transition-colors"
      >
        Excluir cliente
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false} className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Excluir cliente</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir{' '}
              <span className="font-semibold text-foreground">{clientName}</span>?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button variant="outline" className="rounded-xl" disabled={loading}>
                Cancelar
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              className="rounded-xl"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? 'Excluindo…' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

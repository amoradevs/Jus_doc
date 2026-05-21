'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog';

export function DeletePackageButton({ packageId }: { packageId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      await fetch(`/api/geracao/${packageId}`, { method: 'DELETE' });
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        className="rounded-lg text-xs h-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="size-3.5" />
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!loading) setOpen(v); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir pacote?</DialogTitle>
            <DialogDescription>
              O registro e o arquivo ZIP serão removidos permanentemente. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="rounded-xl" disabled={loading}>
                Cancelar
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              className="rounded-xl gap-2"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading && <Loader2 className="size-3.5 animate-spin" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

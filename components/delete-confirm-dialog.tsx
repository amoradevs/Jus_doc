'use client';

import { useState, useRef, useEffect } from 'react';
import { Loader2, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => Promise<void>;
};

export function DeleteConfirmDialog({ open, onOpenChange, title, description, onConfirm }: Props) {
  const [senha, setSenha] = useState('');
  const [verificando, setVerificando] = useState(false);
  const [senhaErrada, setSenhaErrada] = useState(false);
  const [executando, setExecutando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSenha('');
      setSenhaErrada(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  async function handleConfirm() {
    if (!senha) return;
    setSenhaErrada(false);
    setVerificando(true);

    const res = await fetch('/api/verify-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: senha }),
    });

    setVerificando(false);

    if (!res.ok) {
      setSenhaErrada(true);
      setSenha('');
      setTimeout(() => inputRef.current?.focus(), 50);
      return;
    }

    setExecutando(true);
    try {
      await onConfirm();
    } finally {
      setExecutando(false);
    }
  }

  const loading = verificando || executando;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!loading) onOpenChange(v); }}>
      <DialogContent showCloseButton={false} className="max-w-sm rounded-2xl">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-destructive/10">
              <TriangleAlert className="size-4 text-destructive" />
            </span>
            <div>
              <DialogTitle className="text-base">{title}</DialogTitle>
              <DialogDescription className="mt-1 text-sm leading-snug">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-1 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Digite sua senha para confirmar
          </label>
          <Input
            ref={inputRef}
            type="password"
            placeholder="••••••••"
            value={senha}
            onChange={(e) => { setSenha(e.target.value); setSenhaErrada(false); }}
            onKeyDown={(e) => { if (e.key === 'Enter' && senha && !loading) handleConfirm(); }}
            className={`rounded-xl ${senhaErrada ? 'border-destructive focus-visible:ring-destructive' : ''}`}
            disabled={loading}
            autoComplete="current-password"
          />
          {senhaErrada && (
            <p className="text-xs text-destructive">Senha incorreta. Tente novamente.</p>
          )}
        </div>

        <DialogFooter className="mt-2 gap-2">
          <DialogClose asChild>
            <Button variant="outline" className="rounded-xl" disabled={loading}>
              Cancelar
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            className="rounded-xl"
            onClick={handleConfirm}
            disabled={!senha || loading}
          >
            {loading && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
            {executando ? 'Excluindo…' : verificando ? 'Verificando…' : 'Excluir definitivamente'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

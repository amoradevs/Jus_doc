'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { AlertaItem } from './alerta-item';
import { CATALOGO_TEMPLATES } from '@/lib/document-generation/cadeia-documental';
import type { PacoteDocumental, Alerta } from '@/lib/document-generation/cadeia-documental';

const NOMES = Object.fromEntries(CATALOGO_TEMPLATES.map((t) => [t.codigo, t.nome]));

type Props = {
  pacote: PacoteDocumental;
  codigosAtivos: string[];
  onToggleCodigo: (c: string) => void;
  clientId: string;
  onBack: () => void;
};

export function StepConfirmacao({ pacote, codigosAtivos, onToggleCodigo, clientId, onBack }: Props) {
  const router = useRouter();
  const [gerando, setGerando] = useState(false);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [erroGeracao, setErroGeracao] = useState('');

  // Alertas dinâmicos por cadeia mínima desmarcada
  const alertasCadeiaMinima: Alerta[] = useMemo(() => {
    const desmarcados = pacote.codigos.filter(
      (c) => !codigosAtivos.includes(c) && pacote.fonte[c] === 'cadeia_minima',
    );
    if (desmarcados.length === 0) return [];
    const plural = desmarcados.length === 1 ? 'documento' : 'documentos';
    return [{
      nivel: 'aviso' as const,
      codigo: 'CADEIA_MINIMA_DESMARCADA',
      mensagem: `Você desmarcou ${desmarcados.length} ${plural} da cadeia mínima. Confirme se não são necessários antes de gerar.`,
    }];
  }, [pacote.codigos, pacote.fonte, codigosAtivos]);

  const todosAlertas: Alerta[] = [...pacote.alertas, ...alertasCadeiaMinima];
  const erros = todosAlertas.filter((a) => a.nivel === 'erro');
  const avisos = todosAlertas.filter((a) => a.nivel === 'aviso');
  const infos = todosAlertas.filter((a) => a.nivel === 'info');

  const temErro = erros.length > 0;
  const temAviso = avisos.length > 0;
  const podegerar = !temErro && codigosAtivos.length > 0;

  async function executarGeracao() {
    setGerando(true);
    setErroGeracao('');
    try {
      const res = await fetch('/api/geracao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          templateCodes: codigosAtivos,
          cenario: pacote.cenario,
        }),
      });
      const data = await res.json();
      if (data.packageId) {
        router.push(`/clientes/${clientId}/gerar/resultado?packageId=${data.packageId}&modo=direto`);
      } else {
        setErroGeracao(data.error?.message ?? 'Erro ao gerar documentos.');
        setGerando(false);
      }
    } catch {
      setErroGeracao('Falha de conexão. Tente novamente.');
      setGerando(false);
    }
  }

  function handleGerarClick() {
    if (temAviso) {
      setDialogAberto(true);
    } else {
      executarGeracao();
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-foreground">Confirme o pacote</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Revise os documentos e desmarque os que não são necessários.
        </p>
      </div>

      {/* Lista de documentos */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
        {pacote.codigos.map((codigo) => {
          const ativo = codigosAtivos.includes(codigo);
          const isCadeiaMinima = pacote.fonte[codigo] === 'cadeia_minima';
          const alertaCadeiaMinima = !ativo && isCadeiaMinima;

          return (
            <div key={codigo}>
              <label
                htmlFor={`doc-${codigo}`}
                className={`flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors ${
                  alertaCadeiaMinima
                    ? 'bg-amber-50 dark:bg-amber-950/20'
                    : ativo
                    ? 'hover:bg-accent/30'
                    : 'opacity-60 hover:bg-accent/30'
                }`}
              >
                {alertaCadeiaMinima && (
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
                )}
                <Checkbox
                  id={`doc-${codigo}`}
                  checked={ativo}
                  onCheckedChange={() => onToggleCodigo(codigo)}
                  className="mt-0.5 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {NOMES[codigo] ?? `Documento ${codigo}`}
                    </span>
                    {isCadeiaMinima && (
                      <span className="inline-flex items-center rounded-full border border-border bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                        cadeia mínima
                      </span>
                    )}
                  </div>
                  {alertaCadeiaMinima && (
                    <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
                      Documento da cadeia mínima desmarcado — confirme se não é necessário.
                    </p>
                  )}
                </div>
              </label>
            </div>
          );
        })}
      </div>

      {/* Painel de alertas */}
      {todosAlertas.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Alertas</p>
          {[...erros, ...avisos, ...infos].map((a) => (
            <AlertaItem key={a.codigo} alerta={a} />
          ))}
        </div>
      )}

      {erroGeracao && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
          {erroGeracao}
        </div>
      )}

      {/* Barra de ações */}
      <div className="sticky bottom-0 -mx-4 px-4 pb-4 pt-3 bg-background/80 backdrop-blur-sm border-t border-border">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onBack} disabled={gerando} className="rounded-xl">
            Voltar
          </Button>
          <Button
            onClick={handleGerarClick}
            disabled={!podegerar || gerando}
            className="gap-2 rounded-xl"
          >
            {gerando && <Loader2 className="size-3.5 animate-spin" />}
            Gerar documentos
          </Button>
        </div>
      </div>

      {/* Dialog de confirmação de avisos */}
      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar geração</DialogTitle>
            <DialogDescription>
              Há avisos que merecem atenção. Deseja gerar os documentos mesmo assim?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {avisos.map((a) => (
              <AlertaItem key={a.codigo} alerta={a} />
            ))}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="rounded-xl">Cancelar</Button>
            </DialogClose>
            <Button
              className="rounded-xl"
              onClick={() => {
                setDialogAberto(false);
                executarGeracao();
              }}
            >
              Gerar mesmo assim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Loader2, Pencil } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertaItem } from './alerta-item';
import { CATALOGO_TEMPLATES } from '@/lib/document-generation/cadeia-documental';
import type { PacoteDocumental, Alerta } from '@/lib/document-generation/cadeia-documental';

type AdvogadasSelecionadas = 'adv1' | 'adv2';

type AdvSettings = { adv1Nome: string; adv1NomeCurto: string; adv1Oab: string; adv2Nome: string; adv2NomeCurto: string; adv2Oab: string };

const NOMES = Object.fromEntries(CATALOGO_TEMPLATES.map((t) => [t.codigo, t.nome]));

type Testemunha = { nome_completo: string };

type Props = {
  pacote: PacoteDocumental;
  codigosAtivos: string[];
  onToggleCodigo: (c: string) => void;
  clientId: string;
  processoId?: string;
  onBack: () => void;
  advSettings?: AdvSettings;
  testemunhas?: Testemunha[];
  onEditarTestemunhas?: () => void;
};

export function StepConfirmacao({ pacote, codigosAtivos, onToggleCodigo, clientId, processoId, onBack, advSettings, testemunhas, onEditarTestemunhas }: Props) {
  const router = useRouter();
  const [gerando, setGerando] = useState(false);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [erroGeracao, setErroGeracao] = useState('');
  const [modalAdvogadaAberto, setModalAdvogadaAberto] = useState(false);
  const [advogadasSelecionadas, setAdvogadasSelecionadas] = useState<AdvogadasSelecionadas>('adv1');

  const temParceira = !!(advSettings?.adv2Nome);

  const opcoesAdvogada: { value: AdvogadasSelecionadas; label: string; sub?: string }[] = temParceira ? [
    { value: 'adv1', label: `${advSettings?.adv1NomeCurto || advSettings?.adv1Nome}`, sub: advSettings?.adv1Oab ? `OAB ${advSettings.adv1Oab}` : undefined },
    { value: 'adv2', label: `${advSettings?.adv2NomeCurto || advSettings?.adv2Nome}`, sub: advSettings?.adv2Oab ? `OAB ${advSettings.adv2Oab}` : undefined },
  ] : [];

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
      mensagem: `Você desmarcou ${desmarcados.length} ${plural} essencial${desmarcados.length > 1 ? 'is' : ''}. Confirme se não são necessários antes de gerar.`,
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
          processoId: processoId ?? undefined,
          advogadas_selecionadas: advogadasSelecionadas === 'adv2' ? 'alcione' : 'lidiane',

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
    if (codigosAtivos.includes('05') && temParceira) {
      setModalAdvogadaAberto(true);
    } else if (temAviso) {
      setDialogAberto(true);
    } else {
      executarGeracao();
    }
  }

  function handleConfirmarAdvogada() {
    setModalAdvogadaAberto(false);
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
                        essencial
                      </span>
                    )}
                  </div>
                  {alertaCadeiaMinima && (
                    <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
                      Documento essencial desmarcado — confirme se não é necessário.
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
          {[...erros, ...avisos, ...infos].map((a) => {
            if (a.codigo === 'AROGO_CONFIRMAR_TESTEMUNHAS') {
              const t1 = testemunhas?.[0]?.nome_completo;
              const t2 = testemunhas?.[1]?.nome_completo;
              const mensagem = t1 && t2
                ? `Testemunha 1: ${t1} · Testemunha 2: ${t2}`
                : a.mensagem;
              return (
                <div key={a.codigo} className="rounded-xl border border-sky-200 bg-sky-50 dark:border-sky-800 dark:bg-sky-950/30 px-3.5 py-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-sky-800 dark:text-sky-300">{mensagem}</p>
                    {onEditarTestemunhas && (
                      <button
                        type="button"
                        onClick={onEditarTestemunhas}
                        className="shrink-0 flex items-center gap-1 text-xs font-medium text-sky-700 dark:text-sky-400 hover:text-sky-900 dark:hover:text-sky-200 transition-colors"
                      >
                        <Pencil className="w-3 h-3" />
                        Editar
                      </button>
                    )}
                  </div>
                </div>
              );
            }
            return <AlertaItem key={a.codigo} alerta={a} />;
          })}
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

      {/* Modal de seleção de advogada */}
      <Dialog open={modalAdvogadaAberto} onOpenChange={setModalAdvogadaAberto}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Qual advogada será a representante no Termo INSS?</DialogTitle>
            <DialogDescription>
              Contrato e Procuração sempre incluem as duas advogadas.
            </DialogDescription>
          </DialogHeader>
          <RadioGroup
            value={advogadasSelecionadas}
            onValueChange={(v) => setAdvogadasSelecionadas(v as AdvogadasSelecionadas)}
            className="gap-2 py-1"
          >
            {opcoesAdvogada.map((op) => (
              <label
                key={op.value}
                htmlFor={`adv-${op.value}`}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                  advogadasSelecionadas === op.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-accent/30'
                }`}
              >
                <RadioGroupItem id={`adv-${op.value}`} value={op.value} />
                <div>
                  <p className="text-sm font-medium text-foreground">{op.label}</p>
                  {op.sub && <p className="text-xs text-muted-foreground">{op.sub}</p>}
                </div>
              </label>
            ))}
          </RadioGroup>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="rounded-xl">Cancelar</Button>
            </DialogClose>
            <Button className="rounded-xl" onClick={handleConfirmarAdvogada}>
              Confirmar e gerar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

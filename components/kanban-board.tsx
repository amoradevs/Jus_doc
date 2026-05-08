'use client';

import { useState, useTransition, useRef } from 'react';
import Link from 'next/link';
import { ETAPAS_PIPELINE } from '@/lib/pipeline';
import { labelTipoBeneficio } from '@/lib/processo';
import { moverEtapa } from '@/app/(app)/pipeline/actions';
import { CATEGORIA_STYLE, type CategoriaPrazo } from '@/lib/prazos/categorias';

type ProcessoCard = {
  id: string;
  numero_interno: string;
  cliente_id: string;
  nome_completo: string;
  tipo_beneficio: string | null;
  etapa_pipeline: string;
  observacao_pipeline: string | null;
  docs_total: number;
  docs_recebidos: number;
  updated_at: string;
  data_proxima_audiencia?: string | null;
  data_prazo?: string | null;
  tipo_evento?: string | null;
  proximo_prazo?: { data_limite: string; categoria: string; tipo: string; vencido: boolean } | null;
  tem_prazo_vencido?: boolean;
};

interface KanbanBoardProps {
  processos: ProcessoCard[];
}

const ETAPA_COLORS: Record<string, string> = {
  triagem:         'border-t-slate-400',
  consulta:        'border-t-violet-400',
  documentos:      'border-t-amber-400',
  aguardando_inss: 'border-t-blue-400',
  pericia:         'border-t-orange-400',
  judicial:        'border-t-rose-400',
  concedido:       'border-t-emerald-400',
  encerrado:       'border-t-gray-400',
};

const ETAPA_BG: Record<string, string> = {
  triagem:         'bg-slate-50 dark:bg-slate-950/30',
  consulta:        'bg-violet-50 dark:bg-violet-950/30',
  documentos:      'bg-amber-50 dark:bg-amber-950/30',
  aguardando_inss: 'bg-blue-50 dark:bg-blue-950/30',
  pericia:         'bg-orange-50 dark:bg-orange-950/30',
  judicial:        'bg-rose-50 dark:bg-rose-950/30',
  concedido:       'bg-emerald-50 dark:bg-emerald-950/30',
  encerrado:       'bg-gray-50 dark:bg-gray-950/30',
};

const ETAPA_COUNT_BG: Record<string, string> = {
  triagem:         'bg-slate-200 dark:bg-slate-800',
  consulta:        'bg-violet-200 dark:bg-violet-800',
  documentos:      'bg-amber-200 dark:bg-amber-800',
  aguardando_inss: 'bg-blue-200 dark:bg-blue-800',
  pericia:         'bg-orange-200 dark:bg-orange-800',
  judicial:        'bg-rose-200 dark:bg-rose-800',
  concedido:       'bg-emerald-200 dark:bg-emerald-800',
  encerrado:       'bg-gray-200 dark:bg-gray-800',
};

function EtapaIcon({ name }: { name: string }) {
  const cls = 'text-muted-foreground/70 shrink-0';
  const icons: Record<string, React.ReactNode> = {
    triagem: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cls}>
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
      </svg>
    ),
    consulta: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cls}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    documentos: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cls}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    aguardando_inss: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cls}>
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    pericia: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cls}>
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
    judicial: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cls}>
        <line x1="12" y1="3" x2="12" y2="21"/>
        <path d="M5 7l7-4 7 4M5 17l7 4 7-4"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    ),
    concedido: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cls}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
    encerrado: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cls}>
        <polyline points="21 8 21 21 3 21 3 8"/>
        <rect x="1" y="3" width="22" height="5"/>
        <line x1="10" y1="12" x2="14" y2="12"/>
      </svg>
    ),
  };
  return <>{icons[name] ?? null}</>;
}

const TIPO_EVENTO_LABEL: Record<string, string> = {
  audiencia: 'Audiência',
  pericia: 'Perícia',
  consulta: 'Consulta',
  prazo: 'Prazo',
  outro: 'Evento',
};

function AgendarDialog({
  processoId,
  dataAudienciaInicial,
  dataPrazoInicial,
  tipoEventoInicial,
  onClose,
  onSaved,
}: {
  processoId: string;
  dataAudienciaInicial: string | null | undefined;
  dataPrazoInicial: string | null | undefined;
  tipoEventoInicial: string | null | undefined;
  onClose: () => void;
  onSaved: (a: string | null, p: string | null, t: string | null) => void;
}) {
  const [dataAud, setDataAud] = useState(dataAudienciaInicial ?? '');
  const [dataPraz, setDataPraz] = useState(dataPrazoInicial ?? '');
  const [tipo, setTipo] = useState(tipoEventoInicial ?? 'audiencia');
  const [descricao, setDescricao] = useState('');
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');

  async function salvar() {
    setSaving(true);
    setErro('');
    try {
      const res = await fetch(`/api/processos/${processoId}/agenda`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data_proxima_audiencia: dataAud || null,
          data_prazo: dataPraz || null,
          tipo_evento: tipo || null,
          descricao_evento: tipo === 'outro' ? (descricao || null) : null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErro(body?.error ?? 'Erro ao salvar.');
        return;
      }
      onSaved(dataAud || null, dataPraz || null, tipo || null);
      onClose();
    } catch {
      setErro('Erro de conexão. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-2xl shadow-xl p-5 w-[300px] space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Agendar compromisso</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">Tipo</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <option value="audiencia">Audiência</option>
              <option value="pericia">Perícia</option>
              <option value="consulta">Consulta</option>
              <option value="prazo">Prazo</option>
              <option value="outro">Outro</option>
            </select>
          </div>
          {tipo === 'outro' && (
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">O que precisa ser feito?</label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: Reunião com assistente social, protocolar recurso..."
                rows={2}
                className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50 resize-none"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">Data do evento</label>
            <input
              type="date"
              value={dataAud}
              onChange={(e) => setDataAud(e.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">Prazo final (opcional)</label>
            <input
              type="date"
              value={dataPraz}
              onChange={(e) => setDataPraz(e.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </div>
        </div>

        {erro && (
          <p className="text-[11px] text-destructive bg-destructive/10 rounded-lg px-3 py-2 leading-snug">{erro}</p>
        )}

        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 h-8 rounded-lg border border-input text-xs text-muted-foreground hover:bg-secondary transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={salvar}
            disabled={saving}
            className="flex-1 h-8 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function KanbanBoard({ processos }: KanbanBoardProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverEtapa, setDragOverEtapa] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const scrollRef = useRef<HTMLDivElement>(null);
  const mouseXRef = useRef(0);
  const isScrollingRef = useRef(false);

  const processosByEtapa = (etapa: string) =>
    processos.filter((p) => (p.etapa_pipeline || 'triagem') === etapa);

  function startAutoScroll() {
    if (isScrollingRef.current) return;
    isScrollingRef.current = true;
    function tick() {
      if (!isScrollingRef.current || !scrollRef.current) return;
      const container = scrollRef.current;
      const rect = container.getBoundingClientRect();
      const x = mouseXRef.current;
      const zone = 120;
      if (x < rect.left + zone && x > rect.left) {
        const intensity = 1 - (x - rect.left) / zone;
        container.scrollLeft -= Math.ceil(intensity * 16);
      } else if (x > rect.right - zone && x < rect.right) {
        const intensity = 1 - (rect.right - x) / zone;
        container.scrollLeft += Math.ceil(intensity * 16);
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function stopAutoScroll() {
    isScrollingRef.current = false;
  }

  function handleDragStart(e: React.DragEvent, processoId: string) {
    setDraggedId(processoId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', processoId);
    startAutoScroll();
  }

  function handleDragOver(e: React.DragEvent, etapa: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverEtapa(etapa);
    mouseXRef.current = e.clientX;
  }

  function handleDragLeave() {
    setDragOverEtapa(null);
  }

  function handleDragEnd() {
    stopAutoScroll();
    setDraggedId(null);
    setDragOverEtapa(null);
  }

  function handleDrop(e: React.DragEvent, etapa: string) {
    e.preventDefault();
    stopAutoScroll();
    const processoId = e.dataTransfer.getData('text/plain');
    setDragOverEtapa(null);
    setDraggedId(null);

    if (!processoId) return;

    const processo = processos.find((p) => p.id === processoId);
    if (!processo || (processo.etapa_pipeline || 'triagem') === etapa) return;

    startTransition(() => {
      moverEtapa(processoId, etapa);
    });
  }

  function handleMove(processoId: string, etapa: string) {
    const processo = processos.find((p) => p.id === processoId);
    if (!processo || (processo.etapa_pipeline || 'triagem') === etapa) return;
    startTransition(() => {
      moverEtapa(processoId, etapa);
    });
  }

  return (
    <div
      ref={scrollRef}
      className="flex gap-3 overflow-x-auto pb-4 min-h-[calc(100vh-220px)]"
    >
      {ETAPAS_PIPELINE.map((etapa) => {
        const cards = processosByEtapa(etapa.value);
        const isOver = dragOverEtapa === etapa.value;

        return (
          <div
            key={etapa.value}
            className={`flex-shrink-0 w-[260px] flex flex-col rounded-2xl border border-border transition-all duration-200 ${
              isOver ? 'ring-2 ring-primary/30 scale-[1.01]' : ''
            } ${ETAPA_BG[etapa.value] || 'bg-card'}`}
            onDragOver={(e) => handleDragOver(e, etapa.value)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, etapa.value)}
          >
            <div className={`px-4 py-3 border-t-[3px] rounded-t-2xl ${ETAPA_COLORS[etapa.value] || 'border-t-gray-300'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <EtapaIcon name={etapa.icon} />
                  <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    {etapa.label}
                  </h3>
                </div>
                <span className={`text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full ${ETAPA_COUNT_BG[etapa.value] || 'bg-gray-200'}`}>
                  {cards.length}
                </span>
              </div>
            </div>

            <div className="flex-1 px-2 pb-2 space-y-2 overflow-y-auto max-h-[calc(100vh-320px)]">
              {cards.length === 0 && (
                <div className={`rounded-xl border border-dashed border-border/60 p-4 text-center transition-all ${
                  isOver ? 'border-primary/40 bg-primary/5' : ''
                }`}>
                  <p className="text-[11px] text-muted-foreground">
                    {isOver ? 'Solte aqui' : 'Nenhum caso'}
                  </p>
                </div>
              )}

              {cards.map((processo) => (
                <ProcessoKanbanCard
                  key={processo.id}
                  processo={processo}
                  isDragging={draggedId === processo.id}
                  onDragStart={(e) => handleDragStart(e, processo.id)}
                  onDragEnd={handleDragEnd}
                  onMove={(etapa) => handleMove(processo.id, etapa)}
                />
              ))}
            </div>
          </div>
        );
      })}

      {isPending && (
        <div className="fixed bottom-4 right-4 bg-card border border-border rounded-xl px-4 py-2 shadow-lg flex items-center gap-2 z-50">
          <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-muted-foreground">Movendo...</span>
        </div>
      )}
    </div>
  );
}

type PrazoUrgencia = 'vencido' | 'hoje' | 'urgente' | 'proximo' | 'normal' | null;

function getPrazoUrgencia(proximo_prazo: ProcessoCard['proximo_prazo']): PrazoUrgencia {
  if (!proximo_prazo) return null;
  const hoje = new Date().toISOString().slice(0, 10);
  const dl = proximo_prazo.data_limite;
  if (dl < hoje) return 'vencido';
  if (dl === hoje) return 'hoje';
  const diff = Math.ceil((new Date(dl + 'T12:00:00').getTime() - new Date(hoje + 'T12:00:00').getTime()) / 86400000);
  if (diff <= 3) return 'urgente';
  if (diff <= 7) return 'proximo';
  return 'normal';
}

function PrazoBadge({ proximo_prazo }: { proximo_prazo: NonNullable<ProcessoCard['proximo_prazo']> }) {
  const hoje = new Date().toISOString().slice(0, 10);
  const dl = proximo_prazo.data_limite;
  const [, m, d] = dl.split('-');
  const meses = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  const dataFmt = `${parseInt(d)} ${meses[parseInt(m) - 1]}`;

  const style = CATEGORIA_STYLE[proximo_prazo.categoria as CategoriaPrazo];
  const diff = Math.ceil((new Date(dl + 'T12:00:00').getTime() - new Date(hoje + 'T12:00:00').getTime()) / 86400000);

  const urgClass =
    dl < hoje ? 'text-destructive' :
    dl === hoje ? 'text-destructive font-bold' :
    diff <= 3 ? 'text-orange-600 dark:text-orange-400' :
    diff <= 7 ? 'text-amber-600 dark:text-amber-400' :
    'text-muted-foreground';

  return (
    <div className="mt-2 flex items-center gap-1.5 text-[10px]">
      {dl <= hoje && <span className="text-destructive">⚠</span>}
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style?.dot ?? 'bg-primary/60'}`} />
      <span className="text-muted-foreground truncate max-w-[90px]">{proximo_prazo.tipo}</span>
      <span className={`font-medium ${urgClass}`}>{dataFmt}</span>
    </div>
  );
}

function ProcessoKanbanCard({
  processo,
  isDragging,
  onDragStart,
  onDragEnd,
  onMove,
}: {
  processo: ProcessoCard;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onMove: (etapa: string) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dataAud, setDataAud] = useState(processo.data_proxima_audiencia ?? null);
  const [dataPraz, setDataPraz] = useState(processo.data_prazo ?? null);
  const [tipoEv, setTipoEv] = useState(processo.tipo_evento ?? null);

  const urgencia = getPrazoUrgencia(processo.proximo_prazo);
  const borderLeftClass =
    urgencia === 'vencido' ? 'border-l-[3px] border-l-destructive' :
    urgencia === 'hoje'    ? 'border-l-[3px] border-l-destructive' :
    urgencia === 'urgente' ? 'border-l-[3px] border-l-orange-400' :
    urgencia === 'proximo' ? 'border-l-[3px] border-l-amber-400' : '';
  const bgTintClass =
    urgencia === 'hoje' || urgencia === 'vencido' ? 'bg-destructive/[0.02]' : 'bg-card';

  const docsProgress = processo.docs_total > 0
    ? Math.round((processo.docs_recebidos / processo.docs_total) * 100)
    : -1;

  const updatedAt = new Date(processo.updated_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });

  function fmtData(iso: string) {
    const [, m, d] = iso.split('-');
    const meses = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
    return `${parseInt(d)} ${meses[parseInt(m) - 1]}`;
  }

  return (
    <>
      <div
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        className={`${bgTintClass} rounded-xl border border-border p-3 cursor-grab active:cursor-grabbing transition-all duration-150 hover:shadow-md hover:border-primary/30 group select-none ${borderLeftClass} ${
          isDragging ? 'opacity-40 scale-95 rotate-1' : 'opacity-100'
        }`}
      >
        {/* Drag handle + nome */}
        <div className="flex items-start gap-2">
          <svg width="10" height="14" viewBox="0 0 10 16" fill="currentColor" className="text-muted-foreground/30 mt-0.5 shrink-0">
            <circle cx="3" cy="2" r="1.5"/><circle cx="7" cy="2" r="1.5"/>
            <circle cx="3" cy="8" r="1.5"/><circle cx="7" cy="8" r="1.5"/>
            <circle cx="3" cy="14" r="1.5"/><circle cx="7" cy="14" r="1.5"/>
          </svg>
          <div className="flex-1 min-w-0">
            <Link
              href={`/clientes/${processo.cliente_id}`}
              draggable={false}
              onMouseDown={(e) => e.stopPropagation()}
              className="text-sm font-medium text-foreground truncate block group-hover:text-primary transition-colors"
            >
              {processo.nome_completo}
            </Link>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {labelTipoBeneficio(processo.tipo_beneficio)}
            </p>
            <p className="text-[10px] text-muted-foreground/60 font-mono">{processo.numero_interno}</p>
          </div>
        </div>

        {/* Badge de evento agendado (legado) */}
        {dataAud && (
          <div className="mt-2 flex items-center gap-1 text-[10px] text-primary font-medium">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {tipoEv ? TIPO_EVENTO_LABEL[tipoEv] ?? 'Evento' : 'Evento'} · {fmtData(dataAud)}
            {dataPraz && dataPraz !== dataAud && (
              <span className="text-muted-foreground ml-1">· prazo {fmtData(dataPraz)}</span>
            )}
          </div>
        )}

        {/* Badge de prazo estruturado */}
        {processo.proximo_prazo && (
          <PrazoBadge proximo_prazo={processo.proximo_prazo} />
        )}

        {/* Barra de progresso dos documentos */}
        {docsProgress >= 0 && (
          <div className="mt-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground">
                Docs: {processo.docs_recebidos}/{processo.docs_total}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground">{docsProgress}%</span>
            </div>
            <div className="h-1 bg-border rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  docsProgress === 100
                    ? 'bg-emerald-500'
                    : docsProgress >= 50
                    ? 'bg-amber-500'
                    : 'bg-primary'
                }`}
                style={{ width: `${docsProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Observação */}
        {processo.observacao_pipeline && (
          <p className="text-[10px] text-muted-foreground/80 mt-2 italic line-clamp-2 border-l-2 border-primary/20 pl-2">
            {processo.observacao_pipeline}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border/50">
          <span className="text-[10px] text-muted-foreground">{updatedAt}</span>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">

            {/* Agendar */}
            <button
              type="button"
              title="Agendar compromisso"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); setDialogOpen(true); }}
              className="w-6 h-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </button>

            {/* Mover para */}
            <div className="relative w-6 h-6" title="Mover para outra etapa">
              <select
                value=""
                onMouseDown={(e) => e.stopPropagation()}
                onChange={(e) => { if (e.target.value) onMove(e.target.value); }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              >
                <option value="" disabled></option>
                {ETAPAS_PIPELINE.filter((e) => e.value !== processo.etapa_pipeline).map((etapa) => (
                  <option key={etapa.value} value={etapa.value}>{etapa.label}</option>
                ))}
              </select>
              <div className="w-6 h-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors pointer-events-none">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 9l4-4 4 4M9 5v14M19 15l-4 4-4-4M15 19V5"/>
                </svg>
              </div>
            </div>

            {/* Abrir processo */}
            <Link
              href={`/processos/${processo.numero_interno}`}
              draggable={false}
              title="Abrir processo"
              onMouseDown={(e) => e.stopPropagation()}
              className="w-6 h-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </Link>

          </div>
        </div>
      </div>

      {dialogOpen && (
        <AgendarDialog
          processoId={processo.id}
          dataAudienciaInicial={dataAud}
          dataPrazoInicial={dataPraz}
          tipoEventoInicial={tipoEv}
          onClose={() => setDialogOpen(false)}
          onSaved={(a, p, t) => { setDataAud(a); setDataPraz(p); setTipoEv(t); }}
        />
      )}
    </>
  );
}

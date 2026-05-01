'use client';

import { useState, useEffect } from 'react';
import { addWeeks, startOfWeek, endOfWeek, addDays, format, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';

type EventoAgenda = {
  id: string;
  nome_completo: string;
  etapa_pipeline: string;
  tipo_pedido: string | null;
  data_proxima_audiencia: string | null;
  data_prazo: string | null;
  tipo_evento: string | null;
  descricao_evento: string | null;
};

type EventoDia = {
  clienteId: string;
  nomeCliente: string;
  tipo: 'audiencia' | 'prazo';
  tipoEvento: string | null;
  descricao: string | null;
  etapa: string;
};

const EVENTO_CHIP: Record<string, { bg: string; text: string; dot: string; hoverX: string }> = {
  audiencia: { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-400', dot: 'bg-violet-500', hoverX: 'hover:bg-violet-200 dark:hover:bg-violet-800/50' },
  pericia:   { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', dot: 'bg-orange-500', hoverX: 'hover:bg-orange-200 dark:hover:bg-orange-800/50' },
  consulta:  { bg: 'bg-sky-100 dark:bg-sky-900/30',       text: 'text-sky-700 dark:text-sky-400',       dot: 'bg-sky-500',    hoverX: 'hover:bg-sky-200 dark:hover:bg-sky-800/50' },
  prazo:     { bg: 'bg-rose-100 dark:bg-rose-900/30',     text: 'text-rose-700 dark:text-rose-400',     dot: 'bg-rose-500',   hoverX: 'hover:bg-rose-200 dark:hover:bg-rose-800/50' },
  outro:     { bg: 'bg-slate-100 dark:bg-slate-800/50',   text: 'text-slate-600 dark:text-slate-400',   dot: 'bg-slate-400',  hoverX: 'hover:bg-slate-200 dark:hover:bg-slate-700/50' },
};

const ETAPA_CHIP: Record<string, { bg: string; text: string; dot: string; hoverX: string }> = {
  triagem:         { bg: 'bg-slate-100 dark:bg-slate-800/50',     text: 'text-slate-600 dark:text-slate-400',     dot: 'bg-slate-400',  hoverX: 'hover:bg-slate-200' },
  consulta:        { bg: 'bg-violet-100 dark:bg-violet-900/30',   text: 'text-violet-700 dark:text-violet-400',   dot: 'bg-violet-500', hoverX: 'hover:bg-violet-200' },
  documentos:      { bg: 'bg-amber-100 dark:bg-amber-900/30',     text: 'text-amber-700 dark:text-amber-400',     dot: 'bg-amber-500',  hoverX: 'hover:bg-amber-200' },
  aguardando_inss: { bg: 'bg-blue-100 dark:bg-blue-900/30',       text: 'text-blue-700 dark:text-blue-400',       dot: 'bg-blue-500',   hoverX: 'hover:bg-blue-200' },
  pericia:         { bg: 'bg-orange-100 dark:bg-orange-900/30',   text: 'text-orange-700 dark:text-orange-400',   dot: 'bg-orange-500', hoverX: 'hover:bg-orange-200' },
  judicial:        { bg: 'bg-rose-100 dark:bg-rose-900/30',       text: 'text-rose-700 dark:text-rose-400',       dot: 'bg-rose-500',   hoverX: 'hover:bg-rose-200' },
  concedido:       { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500',hoverX: 'hover:bg-emerald-200' },
  encerrado:       { bg: 'bg-gray-100 dark:bg-gray-800/50',       text: 'text-gray-500 dark:text-gray-400',       dot: 'bg-gray-400',   hoverX: 'hover:bg-gray-200' },
};

const TIPO_LABEL: Record<string, string> = {
  audiencia: 'Audiência',
  pericia: 'Perícia',
  consulta: 'Consulta',
  prazo: 'Prazo',
  outro: 'Outro',
};

function chipStyle(tipoEvento: string | null, etapa: string) {
  return EVENTO_CHIP[tipoEvento ?? ''] ?? ETAPA_CHIP[etapa] ?? EVENTO_CHIP['outro'];
}

function EventoChip({
  evento,
  onDelete,
}: {
  evento: EventoDia;
  onDelete: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const style = chipStyle(evento.tipoEvento, evento.etapa);

  const label = evento.tipo === 'prazo'
    ? 'Prazo'
    : evento.tipoEvento === 'outro' && evento.descricao
    ? evento.descricao
    : (TIPO_LABEL[evento.tipoEvento ?? ''] ?? 'Evento');

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDeleting(true);
    try {
      await fetch(`/api/clientes/${evento.clienteId}/agenda`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data_proxima_audiencia: null,
          data_prazo: null,
          tipo_evento: null,
          descricao_evento: null,
        }),
      });
      onDelete();
    } catch {
      setDeleting(false);
    }
  }

  return (
    <div className={`group/chip relative flex items-center gap-1.5 rounded-lg px-2 py-1 ${style.bg} ${style.text}`}>
      <Link
        href={`/clientes/${evento.clienteId}`}
        className="flex items-center gap-1.5 flex-1 min-w-0 hover:opacity-80 transition-opacity"
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
        <span className="text-[10px] font-medium truncate leading-tight">
          {label} · {evento.nomeCliente.split(' ')[0]}
        </span>
      </Link>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className={`shrink-0 rounded p-0.5 opacity-0 group-hover/chip:opacity-100 transition-opacity ${style.hoverX} disabled:opacity-40`}
        title="Excluir agendamento"
      >
        {deleting ? (
          <svg className="animate-spin" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
        ) : (
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round"/>
          </svg>
        )}
      </button>
    </div>
  );
}

function SkeletonChip() {
  return <div className="h-6 rounded-lg bg-muted animate-pulse" />;
}

export function CalendarioSemanal() {
  const [offset, setOffset] = useState(0);
  const [eventos, setEventos] = useState<EventoAgenda[]>([]);
  const [loading, setLoading] = useState(true);

  const hoje = new Date();
  const semanaBase = addWeeks(hoje, offset);
  const semanaStart = startOfWeek(semanaBase, { weekStartsOn: 1 });
  const semanaEnd = endOfWeek(semanaBase, { weekStartsOn: 1 });

  const dias = Array.from({ length: 7 }, (_, i) => addDays(semanaStart, i));

  const labelSemana = (() => {
    const s = format(semanaStart, 'd MMM', { locale: ptBR });
    const e = format(semanaEnd, 'd MMM, yyyy', { locale: ptBR });
    return `${s} – ${e}`;
  })();

  useEffect(() => {
    const start = format(semanaStart, 'yyyy-MM-dd');
    const end = format(semanaEnd, 'yyyy-MM-dd');
    setLoading(true);
    fetch(`/api/agenda?start=${start}&end=${end}`)
      .then((r) => r.json())
      .then((data) => { setEventos(Array.isArray(data) ? data : []); })
      .catch(() => setEventos([]))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset]);

  function removerEvento(clienteId: string) {
    setEventos((prev) => prev.filter((ev) => ev.id !== clienteId));
  }

  function eventosNoDia(dia: Date): EventoDia[] {
    const diaStr = format(dia, 'yyyy-MM-dd');
    const resultado: EventoDia[] = [];
    for (const ev of eventos) {
      if (ev.data_proxima_audiencia === diaStr) {
        resultado.push({
          clienteId: ev.id,
          nomeCliente: ev.nome_completo,
          tipo: 'audiencia',
          tipoEvento: ev.tipo_evento,
          descricao: ev.descricao_evento,
          etapa: ev.etapa_pipeline,
        });
      }
      if (ev.data_prazo === diaStr && ev.data_prazo !== ev.data_proxima_audiencia) {
        resultado.push({
          clienteId: ev.id,
          nomeCliente: ev.nome_completo,
          tipo: 'prazo',
          tipoEvento: 'prazo',
          descricao: null,
          etapa: ev.etapa_pipeline,
        });
      }
    }
    return resultado;
  }

  const temEventos = eventos.length > 0;

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm shadow-[0_2px_8px_rgba(166,102,138,0.06)] overflow-hidden">
      {/* Cabeçalho de navegação */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <span className="text-sm font-medium text-foreground capitalize">{labelSemana}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setOffset((o) => o - 1)}
            className="h-7 w-7 rounded-lg border border-input bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {offset !== 0 && (
            <button
              onClick={() => setOffset(0)}
              className="h-7 px-2.5 rounded-lg border border-input bg-card text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors font-medium"
            >
              Hoje
            </button>
          )}
          <button
            onClick={() => setOffset((o) => o + 1)}
            className="h-7 w-7 rounded-lg border border-input bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Grade semanal */}
      <div className="grid grid-cols-7 divide-x divide-border">
        {dias.map((dia) => {
          const ehHoje = isToday(dia);
          const evsDia = eventosNoDia(dia);
          const nomeDia = format(dia, 'EEE', { locale: ptBR });
          const numDia = format(dia, 'd');

          return (
            <div key={dia.toISOString()} className="flex flex-col min-h-[120px]">
              <div className={`px-2 py-2 text-center border-b border-border ${ehHoje ? 'bg-primary/5' : ''}`}>
                <p className={`text-[10px] font-semibold uppercase tracking-widest ${ehHoje ? 'text-primary' : 'text-muted-foreground'}`}>
                  {nomeDia}
                </p>
                <div className={`text-sm font-bold mt-0.5 leading-none ${
                  ehHoje
                    ? 'w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto text-xs'
                    : 'text-foreground'
                }`}>
                  {numDia}
                </div>
              </div>

              <div className="flex-1 p-1.5 space-y-1">
                {loading
                  ? [1, 2].map((k) => <SkeletonChip key={k} />)
                  : evsDia.map((ev, i) => (
                      <EventoChip
                        key={`${ev.clienteId}-${ev.tipo}-${i}`}
                        evento={ev}
                        onDelete={() => removerEvento(ev.clienteId)}
                      />
                    ))
                }
              </div>
            </div>
          );
        })}
      </div>

      {!loading && !temEventos && (
        <div className="px-5 py-4 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            Nenhum evento nesta semana.{' '}
            <span className="text-primary/70">Agende compromissos nos cards do Pipeline.</span>
          </p>
        </div>
      )}
    </div>
  );
}

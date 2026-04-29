'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { ETAPAS_PIPELINE, etapaInfo } from '@/lib/pipeline';
import { labelTipoPedido } from '@/lib/processo';
import { moverEtapa } from '@/app/(app)/pipeline/actions';

type ClientCard = {
  id: string;
  nome_completo: string;
  tipo_pedido: string | null;
  etapa_pipeline: string;
  observacao_pipeline: string | null;
  docs_total: number;
  docs_recebidos: number;
  atualizado_em: string;
};

interface KanbanBoardProps {
  clients: ClientCard[];
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
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    pericia: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cls}>
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
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

export function KanbanBoard({ clients }: KanbanBoardProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverEtapa, setDragOverEtapa] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const clientsByEtapa = (etapa: string) =>
    clients.filter((c) => (c.etapa_pipeline || 'triagem') === etapa);

  function handleDragStart(e: React.DragEvent, clientId: string) {
    setDraggedId(clientId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', clientId);
  }

  function handleDragOver(e: React.DragEvent, etapa: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverEtapa(etapa);
  }

  function handleDragLeave() {
    setDragOverEtapa(null);
  }

  function handleDrop(e: React.DragEvent, etapa: string) {
    e.preventDefault();
    const clientId = e.dataTransfer.getData('text/plain');
    setDragOverEtapa(null);
    setDraggedId(null);

    if (!clientId) return;

    const client = clients.find((c) => c.id === clientId);
    if (!client || (client.etapa_pipeline || 'triagem') === etapa) return;

    startTransition(() => {
      moverEtapa(clientId, etapa);
    });
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 min-h-[calc(100vh-220px)]">
      {ETAPAS_PIPELINE.map((etapa) => {
        const cards = clientsByEtapa(etapa.value);
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
            {/* Coluna Header */}
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

            {/* Cards */}
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

              {cards.map((client) => (
                <ClientKanbanCard
                  key={client.id}
                  client={client}
                  isDragging={draggedId === client.id}
                  onDragStart={(e) => handleDragStart(e, client.id)}
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

function ClientKanbanCard({
  client,
  isDragging,
  onDragStart,
}: {
  client: ClientCard;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent) => void;
}) {
  const docsProgress = client.docs_total > 0
    ? Math.round((client.docs_recebidos / client.docs_total) * 100)
    : -1;

  const updatedAt = new Date(client.atualizado_em).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={`bg-card rounded-xl border border-border p-3 cursor-grab active:cursor-grabbing transition-all duration-150 hover:shadow-md hover:border-primary/30 group ${
        isDragging ? 'opacity-40 scale-95 rotate-1' : 'opacity-100'
      }`}
    >
      <Link href={`/clientes/${client.id}`} className="block" onClick={(e) => e.stopPropagation()}>
        {/* Nome */}
        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
          {client.nome_completo}
        </p>

        {/* Tipo de pedido */}
        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
          {client.tipo_pedido ? labelTipoPedido(client.tipo_pedido) : 'Sem benefício definido'}
        </p>

        {/* Barra de progresso dos documentos */}
        {docsProgress >= 0 && (
          <div className="mt-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground">
                Docs: {client.docs_recebidos}/{client.docs_total}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground">
                {docsProgress}%
              </span>
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
        {client.observacao_pipeline && (
          <p className="text-[10px] text-muted-foreground/80 mt-2 italic line-clamp-2 border-l-2 border-primary/20 pl-2">
            {client.observacao_pipeline}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border/50">
          <span className="text-[10px] text-muted-foreground">{updatedAt}</span>
          <span className="text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity font-medium">
            Abrir →
          </span>
        </div>
      </Link>
    </div>
  );
}

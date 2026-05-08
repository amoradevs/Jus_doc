'use client';

import { useState, useEffect, useCallback } from 'react';
import { NovoPrazoModal } from './novo-prazo-modal';
import { CumprirModal } from './cumprir-modal';
import { CategoriaBadge } from './categoria-badge';
import { diasRestantes } from '@/lib/prazos/calcular-data-limite';
import { toast } from 'sonner';

type Prazo = {
  id: string;
  categoria: string;
  tipo: string;
  descricao: string | null;
  data_inicio: string;
  data_limite: string;
  dias_uteis: boolean;
  status: 'pendente' | 'cumprido' | 'perdido' | 'cancelado';
  data_cumprimento: string | null;
  anotacao_cumprimento: string | null;
};

type StatusFiltro = 'todos' | 'pendente' | 'cumprido' | 'perdido' | 'cancelado';

function fmtDate(iso: string): string {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

function toIsoToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function DiasRestantesBadge({ prazo }: { prazo: Prazo }) {
  if (prazo.status !== 'pendente') return null;

  const hoje = toIsoToday();
  const dias = diasRestantes(prazo.data_limite, hoje, prazo.dias_uteis);

  if (dias < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-destructive">
        <span>⚠</span> {Math.abs(dias)}d vencido
      </span>
    );
  }
  if (dias === 0) {
    return <span className="text-xs font-bold text-destructive">Vence hoje!</span>;
  }
  if (dias <= 3) {
    return <span className="text-xs font-bold text-orange-600 dark:text-orange-400">{dias}d restantes</span>;
  }
  if (dias <= 7) {
    return <span className="text-xs font-medium text-amber-600 dark:text-amber-400">{dias}d restantes</span>;
  }
  return <span className="text-xs text-muted-foreground">{dias}d restantes</span>;
}

function StatusBadge({ status }: { status: Prazo['status'] }) {
  const map = {
    pendente:  'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300 border-blue-200',
    cumprido:  'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 border-emerald-200',
    perdido:   'bg-destructive/5 text-destructive border-destructive/20',
    cancelado: 'bg-muted text-muted-foreground border-border',
  };
  const label = { pendente: 'Pendente', cumprido: 'Cumprido', perdido: 'Perdido', cancelado: 'Cancelado' };
  return (
    <span className={`text-xs font-medium border rounded-full px-2 py-0.5 ${map[status]}`}>
      {label[status]}
    </span>
  );
}

export function ListaPrazos({ processoId }: { processoId: string }) {
  const [prazos, setPrazos] = useState<Prazo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<StatusFiltro>('todos');
  const [cancelando, setCancelando] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/processos/${processoId}/prazos`);
      const data = await res.json();
      setPrazos(Array.isArray(data) ? data : []);
    } catch {
      setPrazos([]);
    } finally {
      setLoading(false);
    }
  }, [processoId]);

  useEffect(() => { carregar(); }, [carregar]);

  async function cancelarPrazo(prazoId: string) {
    setCancelando(prazoId);
    try {
      const res = await fetch(`/api/prazos/${prazoId}/cancelar`, { method: 'PATCH' });
      if (res.ok) {
        toast.success('Prazo cancelado.');
        await carregar();
      } else {
        const err = await res.json();
        toast.error(err?.error ?? 'Erro ao cancelar prazo.');
      }
    } finally {
      setCancelando(null);
    }
  }

  const prazosFiltrados = prazos.filter((p) =>
    filtro === 'todos' ? true : p.status === filtro
  );

  const FILTROS: { value: StatusFiltro; label: string }[] = [
    { value: 'todos',    label: 'Todos' },
    { value: 'pendente', label: 'Pendentes' },
    { value: 'cumprido', label: 'Cumpridos' },
    { value: 'perdido',  label: 'Perdidos' },
    { value: 'cancelado',label: 'Cancelados' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1 overflow-x-auto">
          {FILTROS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFiltro(f.value)}
              className={`shrink-0 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                filtro === f.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <NovoPrazoModal processoId={processoId} onCriado={carregar} />
      </div>

      {/* Lista */}
      {loading ? (
        <div className="bg-card rounded-2xl border border-border p-6 space-y-3">
          {[1, 2, 3].map((k) => (
            <div key={k} className="h-14 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : prazosFiltrados.length === 0 ? (
        <div className="bg-card rounded-2xl border border-dashed border-border p-14 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
              <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
            </svg>
          </div>
          {filtro === 'todos' ? (
            <>
              <p className="text-sm font-medium text-foreground mb-1">Nenhum prazo cadastrado</p>
              <p className="text-xs text-muted-foreground">Clique em "+ Novo prazo" para começar a monitorar.</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum prazo com status "{filtro}" neste processo.
            </p>
          )}
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {prazosFiltrados.map((prazo, i) => {
            const hoje = toIsoToday();
            const dias = prazo.status === 'pendente'
              ? diasRestantes(prazo.data_limite, hoje, prazo.dias_uteis)
              : null;
            const vencendo = dias !== null && dias <= 3 && dias >= 0;
            const vencido  = dias !== null && dias < 0;

            return (
              <div
                key={prazo.id}
                className={`flex items-start gap-4 px-5 py-4 ${i !== 0 ? 'border-t border-border' : ''} ${
                  vencendo || vencido ? 'bg-destructive/[0.02]' : ''
                }`}
              >
                {/* Ícone de alerta */}
                <div className="shrink-0 mt-0.5 w-5 text-center">
                  {vencido && <span className="text-base leading-none">⚠</span>}
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <CategoriaBadge categoria={prazo.categoria} />
                    <StatusBadge status={prazo.status} />
                    {prazo.dias_uteis && (
                      <span className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">
                        dias úteis
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-medium text-foreground">{prazo.tipo}</p>
                  {prazo.descricao && (
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{prazo.descricao}</p>
                  )}

                  {prazo.status === 'cumprido' && prazo.data_cumprimento && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                      Cumprido em {fmtDate(prazo.data_cumprimento)}
                      {prazo.anotacao_cumprimento && ` — ${prazo.anotacao_cumprimento}`}
                    </p>
                  )}
                </div>

                {/* Data e ações */}
                <div className="shrink-0 text-right space-y-1.5">
                  <p className="text-sm font-medium text-foreground">{fmtDate(prazo.data_limite)}</p>
                  <DiasRestantesBadge prazo={prazo} />

                  {prazo.status === 'pendente' && (
                    <div className="flex items-center gap-3 justify-end mt-1">
                      <CumprirModal
                        prazoId={prazo.id}
                        tipoPrazo={prazo.tipo}
                        onCumprido={carregar}
                      />
                      <button
                        onClick={() => cancelarPrazo(prazo.id)}
                        disabled={cancelando === prazo.id}
                        className="text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                      >
                        {cancelando === prazo.id ? '...' : 'Cancelar'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

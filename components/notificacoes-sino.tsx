'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { CATEGORIA_STYLE, type CategoriaPrazo } from '@/lib/prazos/categorias';

type PrazoUrgente = {
  id: string;
  categoria: string;
  tipo: string;
  data_limite: string;
  numero_interno: string;
  cliente_nome: string | null;
};

function fmtDate(iso: string): string {
  const [, m, d] = iso.split('-');
  const meses = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  return `${parseInt(d)} ${meses[parseInt(m) - 1]}`;
}

function toIsoToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function NotificacoesSino() {
  const [urgentes, setUrgentes] = useState<PrazoUrgente[]>([]);
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const buscarUrgentes = useCallback(async () => {
    try {
      const res = await fetch('/api/prazos/urgentes');
      if (!res.ok) return;
      const data = await res.json();
      setUrgentes(Array.isArray(data.urgentes) ? data.urgentes : []);
    } catch {
      // silencioso — bell é best-effort
    }
  }, []);

  useEffect(() => {
    buscarUrgentes();
    const intervalo = setInterval(buscarUrgentes, 5 * 60 * 1000);
    return () => clearInterval(intervalo);
  }, [buscarUrgentes]);

  // Atualiza ao marcar prazo como cumprido ou cancelado
  useEffect(() => {
    function onPrazoUpdated() { buscarUrgentes(); }
    window.addEventListener('prazo-updated', onPrazoUpdated);
    return () => window.removeEventListener('prazo-updated', onPrazoUpdated);
  }, [buscarUrgentes]);

  // Fecha ao clicar fora
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAberto(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const hoje = toIsoToday();
  const total = urgentes.length;

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setAberto((v) => !v)}
        className="relative w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        aria-label="Notificações de prazos urgentes"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {total > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-destructive text-[9px] font-bold text-white flex items-center justify-center px-1 leading-none">
            {total > 9 ? '9+' : total}
          </span>
        )}
      </button>

      {aberto && (
        <div className="absolute right-0 top-10 w-72 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">
              Prazos urgentes
            </span>
            {total > 0 && (
              <span className="text-[10px] text-muted-foreground">{total} {total === 1 ? 'pendente' : 'pendentes'}</span>
            )}
          </div>

          {total === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-xs text-muted-foreground">Nenhum prazo urgente nos próximos 2 dias.</p>
            </div>
          ) : (
            <div className="divide-y divide-border max-h-80 overflow-y-auto">
              {urgentes.map((pz) => {
                const style = CATEGORIA_STYLE[pz.categoria as CategoriaPrazo];
                const vencido = pz.data_limite < hoje;
                const ehHoje = pz.data_limite === hoje;

                return (
                  <Link
                    key={pz.id}
                    href={`/processos/${pz.numero_interno}?tab=prazos`}
                    onClick={() => setAberto(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-secondary/40 transition-colors"
                  >
                    <span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${style?.dot ?? 'bg-primary/60'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-foreground truncate">{pz.tipo}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {pz.cliente_nome} · {pz.numero_interno}
                      </p>
                      <p className={`text-[10px] font-semibold mt-0.5 ${
                        vencido ? 'text-destructive' :
                        ehHoje ? 'text-destructive' :
                        'text-orange-600 dark:text-orange-400'
                      }`}>
                        {vencido ? `⚠ Venceu ${fmtDate(pz.data_limite)}` :
                         ehHoje ? 'Vence hoje!' :
                         `Vence ${fmtDate(pz.data_limite)}`}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

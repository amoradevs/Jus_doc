'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

type Template = {
  id: string;
  codigo: string;
  nome: string;
  familia: 'contrato' | 'procuracao' | 'declaracao' | 'termo';
  formato: 'docx' | 'pdf';
};

type Props = { clientId: string; templates: Template[] };

const FAMILIAS = [
  { key: 'todas', label: 'Todos' },
  { key: 'contrato', label: 'Contratos' },
  { key: 'procuracao', label: 'Procurações' },
  { key: 'declaracao', label: 'Declarações' },
  { key: 'termo', label: 'Termos' },
] as const;

const CORES: Record<string, {
  card: string;
  cardAtivo: string;
  badge: string;
  pill: string;
  pillAtivo: string;
  check: string;
  checkAtivo: string;
}> = {
  contrato: {
    card: 'border-blue-100 bg-blue-50/60 hover:border-blue-300 dark:bg-blue-950/20 dark:border-blue-900/50 dark:hover:border-blue-700',
    cardAtivo: 'border-blue-400 bg-blue-50 ring-1 ring-blue-300 dark:bg-blue-950/30 dark:border-blue-600 dark:ring-blue-900',
    badge: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    pill: 'border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-400 dark:bg-blue-950/20 dark:text-blue-300 dark:border-blue-900 dark:hover:border-blue-600',
    pillAtivo: 'bg-blue-600 text-white border-blue-600 dark:bg-blue-700 dark:border-blue-700',
    check: 'border-blue-200 dark:border-blue-800',
    checkAtivo: 'bg-blue-600 border-blue-600 dark:bg-blue-700 dark:border-blue-700',
  },
  procuracao: {
    card: 'border-emerald-100 bg-emerald-50/60 hover:border-emerald-300 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:hover:border-emerald-700',
    cardAtivo: 'border-emerald-400 bg-emerald-50 ring-1 ring-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-600 dark:ring-emerald-900',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    pill: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-400 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-900 dark:hover:border-emerald-600',
    pillAtivo: 'bg-emerald-600 text-white border-emerald-600 dark:bg-emerald-700 dark:border-emerald-700',
    check: 'border-emerald-200 dark:border-emerald-800',
    checkAtivo: 'bg-emerald-600 border-emerald-600 dark:bg-emerald-700 dark:border-emerald-700',
  },
  declaracao: {
    card: 'border-amber-100 bg-amber-50/60 hover:border-amber-300 dark:bg-amber-950/20 dark:border-amber-900/50 dark:hover:border-amber-700',
    cardAtivo: 'border-amber-400 bg-amber-50 ring-1 ring-amber-300 dark:bg-amber-950/30 dark:border-amber-600 dark:ring-amber-900',
    badge: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    pill: 'border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-400 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-900 dark:hover:border-amber-600',
    pillAtivo: 'bg-amber-600 text-white border-amber-600 dark:bg-amber-700 dark:border-amber-700',
    check: 'border-amber-200 dark:border-amber-800',
    checkAtivo: 'bg-amber-600 border-amber-600 dark:bg-amber-700 dark:border-amber-700',
  },
  termo: {
    card: 'border-violet-100 bg-violet-50/60 hover:border-violet-300 dark:bg-violet-950/20 dark:border-violet-900/50 dark:hover:border-violet-700',
    cardAtivo: 'border-violet-400 bg-violet-50 ring-1 ring-violet-300 dark:bg-violet-950/30 dark:border-violet-600 dark:ring-violet-900',
    badge: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800',
    pill: 'border-violet-200 bg-violet-50 text-violet-700 hover:border-violet-400 dark:bg-violet-950/20 dark:text-violet-300 dark:border-violet-900 dark:hover:border-violet-600',
    pillAtivo: 'bg-violet-600 text-white border-violet-600 dark:bg-violet-700 dark:border-violet-700',
    check: 'border-violet-200 dark:border-violet-800',
    checkAtivo: 'bg-violet-600 border-violet-600 dark:bg-violet-700 dark:border-violet-700',
  },
  todas: {
    card: 'border-border bg-card hover:border-border/80 hover:bg-secondary/30',
    cardAtivo: 'border-primary bg-primary/5 ring-1 ring-primary/30',
    badge: 'bg-secondary text-muted-foreground border-border',
    pill: 'border-border bg-card text-muted-foreground hover:text-foreground hover:border-border/80',
    pillAtivo: 'bg-primary text-primary-foreground border-primary',
    check: 'border-border',
    checkAtivo: 'bg-primary border-primary',
  },
};

const LABEL_FAMILIA: Record<string, string> = {
  contrato: 'Contrato',
  procuracao: 'Procuração',
  declaracao: 'Declaração',
  termo: 'Termo',
};

export function TemplateSelector({ clientId, templates }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [filtro, setFiltro] = useState<string>('todas');

  const toggle = (codigo: string) =>
    setSelected((prev) =>
      prev.includes(codigo) ? prev.filter((c) => c !== codigo) : [...prev, codigo]
    );

  const visíveis = filtro === 'todas' ? templates : templates.filter((t) => t.familia === filtro);

  const continuar = (modo: 'direto' | 'revisar') => {
    if (selected.length === 0) return;
    router.push(`/clientes/${clientId}/gerar/campos?codigos=${selected.join(',')}&modo=${modo}`);
  };

  return (
    <div>
      {/* Filtros por família */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FAMILIAS.map(({ key, label }) => {
          const cor = CORES[key] ?? CORES.todas;
          const ativo = filtro === key;
          return (
            <button
              key={key}
              onClick={() => setFiltro(key)}
              className={`px-3.5 py-1.5 rounded-full text-sm border transition-colors font-medium ${
                ativo ? cor.pillAtivo : cor.pill
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Grid de templates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {visíveis.map((t) => {
          const ativo = selected.includes(t.codigo);
          const cor = CORES[t.familia] ?? CORES.todas;
          return (
            <button
              key={t.id}
              onClick={() => toggle(t.codigo)}
              className={`text-left p-4 rounded-xl border transition-all ${
                ativo ? cor.cardAtivo : cor.card
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium text-foreground leading-snug">{t.nome}</span>
                <div
                  className={`mt-0.5 w-4 h-4 rounded border shrink-0 flex items-center justify-center ${
                    ativo ? cor.checkAtivo : cor.check
                  }`}
                >
                  {ativo && (
                    <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M2 6l3 3 5-5" />
                    </svg>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-2.5">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border font-medium ${cor.badge}`}>
                  {LABEL_FAMILIA[t.familia] ?? t.familia}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs border font-medium bg-secondary text-muted-foreground border-border">
                  {t.formato.toUpperCase()}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => continuar('direto')} disabled={selected.length === 0} className="rounded-xl gap-2">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/>
            <path d="M13 2v7h7" strokeLinecap="round"/>
          </svg>
          Gerar PDF direto
        </Button>
        <Button onClick={() => continuar('revisar')} disabled={selected.length === 0} variant="outline" className="rounded-xl gap-2">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round"/>
          </svg>
          Revisar antes
        </Button>
        {selected.length > 0 && (
          <button
            onClick={() => setSelected([])}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Limpar ({selected.length})
          </button>
        )}
      </div>
    </div>
  );
}

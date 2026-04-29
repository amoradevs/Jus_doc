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
    card: 'border-blue-100 bg-blue-50/50 hover:border-blue-300',
    cardAtivo: 'border-blue-400 bg-blue-50 ring-1 ring-blue-300',
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    pill: 'border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-400',
    pillAtivo: 'bg-blue-600 text-white border-blue-600',
    check: 'border-blue-200',
    checkAtivo: 'bg-blue-600 border-blue-600',
  },
  procuracao: {
    card: 'border-emerald-100 bg-emerald-50/50 hover:border-emerald-300',
    cardAtivo: 'border-emerald-400 bg-emerald-50 ring-1 ring-emerald-300',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    pill: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-400',
    pillAtivo: 'bg-emerald-600 text-white border-emerald-600',
    check: 'border-emerald-200',
    checkAtivo: 'bg-emerald-600 border-emerald-600',
  },
  declaracao: {
    card: 'border-amber-100 bg-amber-50/50 hover:border-amber-300',
    cardAtivo: 'border-amber-400 bg-amber-50 ring-1 ring-amber-300',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    pill: 'border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-400',
    pillAtivo: 'bg-amber-600 text-white border-amber-600',
    check: 'border-amber-200',
    checkAtivo: 'bg-amber-600 border-amber-600',
  },
  termo: {
    card: 'border-violet-100 bg-violet-50/50 hover:border-violet-300',
    cardAtivo: 'border-violet-400 bg-violet-50 ring-1 ring-violet-300',
    badge: 'bg-violet-100 text-violet-700 border-violet-200',
    pill: 'border-violet-200 bg-violet-50 text-violet-700 hover:border-violet-400',
    pillAtivo: 'bg-violet-600 text-white border-violet-600',
    check: 'border-violet-200',
    checkAtivo: 'bg-violet-600 border-violet-600',
  },
  todas: {
    card: 'border-slate-200 bg-white hover:border-slate-400',
    cardAtivo: 'border-slate-800 bg-slate-50 ring-1 ring-slate-800',
    badge: 'bg-slate-100 text-slate-600 border-slate-200',
    pill: 'border-slate-300 bg-white text-slate-600 hover:border-slate-500',
    pillAtivo: 'bg-slate-800 text-white border-slate-800',
    check: 'border-slate-300',
    checkAtivo: 'bg-slate-800 border-slate-800',
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
    setSelected((prev) => prev.includes(codigo) ? prev.filter((c) => c !== codigo) : [...prev, codigo]);

  const visíveis = filtro === 'todas' ? templates : templates.filter((t) => t.familia === filtro);

  const continuar = () => {
    if (selected.length === 0) return;
    router.push(`/clientes/${clientId}/gerar/campos?codigos=${selected.join(',')}`);
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
              className={`px-3 py-1 rounded-full text-sm border transition-colors font-medium ${
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
                <span className="text-sm font-medium text-slate-800 leading-snug">{t.nome}</span>
                <div className={`mt-0.5 w-4 h-4 rounded border shrink-0 flex items-center justify-center ${
                  ativo ? cor.checkAtivo : cor.check
                }`}>
                  {ativo && <span className="text-white text-xs">✓</span>}
                </div>
              </div>
              <div className="flex gap-2 mt-2.5">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border font-medium ${cor.badge}`}>
                  {LABEL_FAMILIA[t.familia] ?? t.familia}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs border font-medium bg-slate-100 text-slate-500 border-slate-200">
                  {t.formato.toUpperCase()}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-4">
        <Button onClick={continuar} disabled={selected.length === 0}>
          Continuar ({selected.length} selecionado{selected.length !== 1 ? 's' : ''})
        </Button>
        {selected.length > 0 && (
          <button onClick={() => setSelected([])} className="text-sm text-slate-400 hover:text-slate-600">
            Limpar seleção
          </button>
        )}
      </div>
    </div>
  );
}

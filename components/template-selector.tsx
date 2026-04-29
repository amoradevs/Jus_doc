'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
      <div className="flex flex-wrap gap-2 mb-6">
        {FAMILIAS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFiltro(key)}
            className={`px-3 py-1 rounded-full text-sm border transition-colors ${filtro === key ? 'bg-slate-800 text-white border-slate-800' : 'border-slate-300 text-slate-600 hover:border-slate-500'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {visíveis.map((t) => {
          const ativo = selected.includes(t.codigo);
          return (
            <button
              key={t.id}
              onClick={() => toggle(t.codigo)}
              className={`text-left p-4 rounded-lg border transition-all ${ativo ? 'border-slate-800 bg-slate-50 ring-1 ring-slate-800' : 'border-slate-200 hover:border-slate-400 bg-white'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium text-slate-800 leading-snug">{t.nome}</span>
                <div className={`mt-0.5 w-4 h-4 rounded border shrink-0 flex items-center justify-center ${ativo ? 'bg-slate-800 border-slate-800' : 'border-slate-300'}`}>
                  {ativo && <span className="text-white text-xs">✓</span>}
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="text-xs capitalize">{t.familia}</Badge>
                <Badge variant="outline" className="text-xs uppercase">{t.formato}</Badge>
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

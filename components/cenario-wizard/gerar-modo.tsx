'use client';

import { useState } from 'react';
import { WizardCenario } from './wizard-cenario';
import { TemplateSelector } from '@/components/template-selector';

type Template = {
  id: string;
  codigo: string;
  nome: string;
  familia: 'contrato' | 'procuracao' | 'declaracao' | 'termo';
  formato: 'docx' | 'pdf';
};

type Props = { clientId: string; templates: Template[] };

export function GerarModo({ clientId, templates }: Props) {
  const [modo, setModo] = useState<'wizard' | 'avancado'>('wizard');

  return (
    <div>
      {/* Toggle de modo */}
      <div className="mb-6 flex items-center gap-1 rounded-xl border border-border bg-secondary p-1 w-fit">
        <button
          onClick={() => setModo('wizard')}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
            modo === 'wizard'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Assistente
        </button>
        <button
          onClick={() => setModo('avancado')}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
            modo === 'avancado'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Avançado
        </button>
      </div>

      {modo === 'wizard' ? (
        <WizardCenario clientId={clientId} />
      ) : (
        <TemplateSelector clientId={clientId} templates={templates} />
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UploadStep } from './upload-step';
import { ReviewStep } from './review-step';
import type { TagSuggestion } from '@/lib/template-wizard/ai-tagger';

type AnalysisResult = {
  file: File;
  suggestions: TagSuggestion[];
  textPreview: string;
  nome: string;
  categoria: string;
  codigo: string;
};

type Phase = 'upload' | 'review' | 'done';

export function WizardFlow({ proximoCodigo }: { proximoCodigo: string }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('upload');
  const [result, setResult] = useState<AnalysisResult | null>(null);

  if (phase === 'done') {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-green-500" />
        <div>
          <p className="text-base font-semibold text-foreground">Template salvo com sucesso!</p>
          <p className="text-sm text-muted-foreground mt-1">
            O documento foi taguiado e adicionado à lista de templates.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push('/configuracoes/templates')}>
            Ver templates
          </Button>
          <Button variant="outline" onClick={() => { setPhase('upload'); setResult(null); }}>
            Adicionar outro
          </Button>
        </div>
      </div>
    );
  }

  if (phase === 'review' && result) {
    return (
      <ReviewStep
        {...result}
        onBack={() => setPhase('upload')}
        onSaved={() => setPhase('done')}
      />
    );
  }

  return (
    <UploadStep
      proximoCodigo={proximoCodigo}
      onAnalyzed={(data) => {
        setResult(data);
        setPhase('review');
      }}
    />
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UploadStep } from './upload-step';

type Phase = 'upload' | 'done';

export function WizardFlow({ proximoCodigo }: { proximoCodigo: string }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('upload');

  if (phase === 'done') {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-green-500" />
        <div>
          <p className="text-base font-semibold text-foreground">Template salvo com sucesso!</p>
          <p className="text-sm text-muted-foreground mt-1">
            O documento foi adicionado à lista de templates.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push('/configuracoes/templates')}>
            Ver templates
          </Button>
          <Button variant="outline" onClick={() => setPhase('upload')}>
            Adicionar outro
          </Button>
        </div>
      </div>
    );
  }

  return (
    <UploadStep
      proximoCodigo={proximoCodigo}
      onSaved={() => setPhase('done')}
    />
  );
}

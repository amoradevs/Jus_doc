'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  montarPacote,
  type BeneficioId,
  type PerfilId,
  type GatilhoId,
  type PacoteDocumental,
} from '@/lib/document-generation/cadeia-documental';
import { StepBeneficio } from './step-beneficio';
import { StepPerfil } from './step-perfil';
import { StepGatilhos } from './step-gatilhos';
import { StepConfirmacao } from './step-confirmacao';

type Step = 1 | 2 | 3 | 4;

const LABELS: Record<Step, string> = {
  1: 'Benefício',
  2: 'Perfil',
  3: 'Situações',
  4: 'Confirmação',
};

type Props = { clientId: string; processoId?: string };

function StepIndicator({ step }: { step: Step }) {
  return (
    <div className="mb-6" aria-label="Progresso do wizard">
      <div className="flex items-center justify-between">
        {([1, 2, 3, 4] as Step[]).map((s, i) => (
          <div key={s} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'flex size-7 items-center justify-center rounded-full text-xs font-semibold transition-all',
                  step === s
                    ? 'bg-primary text-primary-foreground'
                    : s < step
                    ? 'bg-primary/20 text-primary'
                    : 'bg-secondary text-muted-foreground',
                )}
              >
                {s < step ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : s}
              </div>
              <span className={cn(
                'hidden text-xs sm:block transition-colors',
                step === s ? 'font-medium text-foreground' : 'text-muted-foreground',
              )}>
                {LABELS[s]}
              </span>
            </div>
            {i < 3 && (
              <div className={cn(
                'mb-5 h-px flex-1 mx-2 transition-colors',
                s < step ? 'bg-primary/30' : 'bg-border',
              )} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function WizardCenario({ clientId, processoId }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [beneficio, setBeneficio] = useState<BeneficioId | null>(null);
  const [perfil, setPerfil] = useState<PerfilId | null>(null);
  const [gatilhos, setGatilhos] = useState<GatilhoId[]>([]);
  const [pacote, setPacote] = useState<PacoteDocumental | null>(null);
  const [codigosAtivos, setCodigosAtivos] = useState<string[]>([]);

  function irParaPasso(destino: Step) {
    setStep(destino);
  }

  // ── Navegação com reset condicional ───────────────────────────────────────

  function handleBeneficioChange(b: BeneficioId) {
    if (b !== beneficio) {
      // Mudança de benefício → reseta tudo abaixo
      setPerfil(null);
      setGatilhos([]);
      setPacote(null);
      setCodigosAtivos([]);
    }
    setBeneficio(b);
  }

  function handlePerfilChange(p: PerfilId) {
    setPerfil(p);
    // Mudança de perfil invalida o pacote computado
    setPacote(null);
    setCodigosAtivos([]);
  }

  function handleGatilhosChange(g: GatilhoId[]) {
    setGatilhos(g);
    setPacote(null);
    setCodigosAtivos([]);
  }

  function irParaConfirmacao() {
    if (!beneficio || !perfil) return;
    const cenario = { beneficio, perfil, gatilhos };
    const p = montarPacote(cenario);
    setPacote(p);
    setCodigosAtivos([...p.codigos]);
    setStep(4);
  }

  function toggleCodigo(codigo: string) {
    setCodigosAtivos((prev) =>
      prev.includes(codigo) ? prev.filter((c) => c !== codigo) : [...prev, codigo],
    );
  }

  return (
    <div>
      <StepIndicator step={step} />

      {step === 1 && (
        <StepBeneficio
          value={beneficio}
          onChange={handleBeneficioChange}
          onNext={() => irParaPasso(2)}
        />
      )}

      {step === 2 && (
        <StepPerfil
          value={perfil}
          onChange={handlePerfilChange}
          onNext={() => irParaPasso(3)}
          onBack={() => irParaPasso(1)}
        />
      )}

      {step === 3 && (
        <StepGatilhos
          value={gatilhos}
          onChange={handleGatilhosChange}
          onNext={irParaConfirmacao}
          onBack={() => irParaPasso(2)}
          beneficio={beneficio}
        />
      )}

      {step === 4 && pacote && (
        <StepConfirmacao
          pacote={pacote}
          codigosAtivos={codigosAtivos}
          onToggleCodigo={toggleCodigo}
          clientId={clientId}
          processoId={processoId}
          onBack={() => irParaPasso(3)}
        />
      )}
    </div>
  );
}

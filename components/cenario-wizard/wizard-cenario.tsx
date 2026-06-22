'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  montarPacote,
  PERFIS_MENORES,
  type BeneficioId,
  type PerfilId,
  type GatilhoId,
  type PacoteDocumental,
} from '@/lib/document-generation/cadeia-documental';
import { StepBeneficio } from './step-beneficio';
import { StepPerfil, type Testemunha, type RepresentanteLegal, type Validador } from './step-perfil';
import { StepGatilhos } from './step-gatilhos';
import { StepConfirmacao } from './step-confirmacao';

type Step = 1 | 2 | 3 | 4;

const LABELS: Record<Step, string> = {
  1: 'Benefício',
  2: 'Perfil',
  3: 'Situações',
  4: 'Confirmação',
};

type AdvSettings = { adv1Nome: string; adv1NomeCurto: string; adv1Oab: string; adv2Nome: string; adv2NomeCurto: string; adv2Oab: string };
type Props = { clientId: string; processoId?: string; advSettings?: AdvSettings };

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

export function WizardCenario({ clientId, processoId, advSettings }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [beneficio, setBeneficio] = useState<BeneficioId | null>(null);
  const [msOrgao, setMsOrgao] = useState<'inss' | 'cras' | null>(null);
  const [aposentadoriaModalidade, setAposentadoriaModalidade] = useState<'urbana' | 'rural' | null>(null);
  const [perfil, setPerfil] = useState<PerfilId | null>(null);
  const [gatilhos, setGatilhos] = useState<GatilhoId[]>([]);
  const [pacote, setPacote] = useState<PacoteDocumental | null>(null);
  const [codigosAtivos, setCodigosAtivos] = useState<string[]>([]);
  const [testemunhas, setTestemunhas] = useState<Testemunha[]>([]);
  const [representanteLegal, setRepresentanteLegal] = useState<RepresentanteLegal | undefined>(undefined);
  const [validador, setValidador] = useState<Validador | undefined>(undefined);

  useEffect(() => {
    fetch(`/api/clientes/${clientId}/contextual-data`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data?.testemunhas) && data.testemunhas.length > 0) {
          setTestemunhas(data.testemunhas);
        }
        if (data?.representante_legal) {
          setRepresentanteLegal(data.representante_legal as RepresentanteLegal);
        }
        if (data?.validador) {
          setValidador(data.validador as Validador);
        }
      })
      .catch(() => {});
  }, [clientId]);

  function irParaPasso(destino: Step) {
    setStep(destino);
  }

  // ── Navegação com reset condicional ───────────────────────────────────────

  function handleBeneficioChange(b: BeneficioId) {
    if (b !== beneficio) {
      setPerfil(null);
      setGatilhos([]);
      setPacote(null);
      setCodigosAtivos([]);
      setMsOrgao(null);
      setAposentadoriaModalidade(null);
    }
    setBeneficio(b);
  }

  function handlePerfilChange(p: PerfilId) {
    setPerfil(p);
    const gatilhosBase: GatilhoId[] = PERFIS_MENORES.includes(p) ? ['tem_representacao_legal'] : [];
    setGatilhos(gatilhosBase);
    setPacote(null);
    setCodigosAtivos([]);
  }

  function handleGatilhosChange(g: GatilhoId[]) {
    const ehMenor = perfil !== null && perfil !== undefined && PERFIS_MENORES.includes(perfil);
    const gatilhosFinais =
      ehMenor && !g.includes('tem_representacao_legal')
        ? [...g, 'tem_representacao_legal' as GatilhoId]
        : g;
    setGatilhos(gatilhosFinais);
    setPacote(null);
    setCodigosAtivos([]);
  }

  function irParaConfirmacao() {
    if (!beneficio || !perfil) return;
    const ehMenor = PERFIS_MENORES.includes(perfil);
    const gatilhosFinais =
      ehMenor && !gatilhos.includes('tem_representacao_legal')
        ? [...gatilhos, 'tem_representacao_legal' as GatilhoId]
        : gatilhos;
    const cenario = {
      beneficio,
      perfil,
      gatilhos: gatilhosFinais,
      ...(msOrgao ? { ms_orgao: msOrgao } : {}),
      ...(beneficio === 'aposentadoria_idade' && aposentadoriaModalidade ? { aposentadoria_idade_modalidade: aposentadoriaModalidade } : {}),
    };
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
          msOrgao={msOrgao}
          onMsOrgaoChange={setMsOrgao}
          aposentadoriaModalidade={aposentadoriaModalidade}
          onAposentadoriaModalidadeChange={setAposentadoriaModalidade}
        />
      )}

      {step === 2 && (
        <StepPerfil
          clientId={clientId}
          beneficio={beneficio}
          value={perfil}
          onChange={handlePerfilChange}
          onNext={() => irParaPasso(3)}
          onBack={() => irParaPasso(1)}
          initialTestemunhas={testemunhas}
          onTestemunhasSalvas={setTestemunhas}
          initialRepresentanteLegal={representanteLegal}
          onRepresentanteLegalSalvo={setRepresentanteLegal}
          initialValidador={validador}
          onValidadorSalvo={setValidador}
        />
      )}

      {step === 3 && (
        <StepGatilhos
          clientId={clientId}
          value={gatilhos}
          onChange={handleGatilhosChange}
          onNext={irParaConfirmacao}
          onBack={() => irParaPasso(2)}
          beneficio={beneficio}
          perfil={perfil}
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
          advSettings={advSettings}
          testemunhas={testemunhas}
          onEditarTestemunhas={() => irParaPasso(2)}
        />
      )}
    </div>
  );
}

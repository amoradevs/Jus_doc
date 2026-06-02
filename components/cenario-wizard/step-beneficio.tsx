'use client';

import { useState } from 'react';
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';
import { Briefcase, Scale, Shield, HeartHandshake, Building2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import type { BeneficioId } from '@/lib/document-generation/cadeia-documental';

const OPCOES: { value: BeneficioId; label: string; descricao: string; Icon: React.ElementType }[] = [
  {
    value: 'bpc',
    label: 'BPC / LOAS',
    descricao: 'Benefício de Prestação Continuada — para pessoa com deficiência ou idoso em situação de vulnerabilidade.',
    Icon: Shield,
  },
  {
    value: 'aposentadoria_idade',
    label: 'Aposentadoria por Idade',
    descricao: 'Benefício previdenciário para segurado que atingiu a idade mínima e cumpriu carência.',
    Icon: Briefcase,
  },
  {
    value: 'mandado_seguranca',
    label: 'Mandado de Segurança',
    descricao: 'Ação judicial para combater ato ilegal ou abusivo de autoridade — sem processo administrativo prévio.',
    Icon: Scale,
  },
  {
    value: 'pensao_morte',
    label: 'Pensão por Morte',
    descricao: 'Benefício previdenciário devido aos dependentes do segurado falecido.',
    Icon: HeartHandshake,
  },
];

const ORGAOS: { value: 'inss' | 'cras'; label: string; descricao: string; Icon: React.ElementType }[] = [
  {
    value: 'inss',
    label: 'INSS',
    descricao: 'Instituto Nacional do Seguro Social — autoridade previdenciária federal.',
    Icon: Building2,
  },
  {
    value: 'cras',
    label: 'CRAS',
    descricao: 'Centro de Referência de Assistência Social — unidade de assistência social municipal.',
    Icon: Users,
  },
];

type Props = {
  value: BeneficioId | null;
  onChange: (b: BeneficioId) => void;
  onNext: () => void;
  msOrgao: 'inss' | 'cras' | null;
  onMsOrgaoChange: (orgao: 'inss' | 'cras') => void;
};

export function StepBeneficio({ value, onChange, onNext, msOrgao, onMsOrgaoChange }: Props) {
  const [modalAberto, setModalAberto] = useState(false);
  const [orgaoLocal, setOrgaoLocal] = useState<'inss' | 'cras' | null>(null);

  function abrirModal() {
    setOrgaoLocal(msOrgao);
    setModalAberto(true);
  }

  function handleBeneficioChange(v: string) {
    onChange(v as BeneficioId);
    if (v === 'mandado_seguranca') {
      abrirModal();
    }
  }

  function confirmarOrgao() {
    if (!orgaoLocal) return;
    onMsOrgaoChange(orgaoLocal);
    setModalAberto(false);
  }

  function handleAvancar() {
    if (value === 'mandado_seguranca' && !msOrgao) {
      abrirModal();
      return;
    }
    onNext();
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-foreground">Qual é o benefício?</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">Selecione o tipo de ação para este cliente.</p>
      </div>

      <RadioGroupPrimitive.Root
        value={value ?? ''}
        onValueChange={handleBeneficioChange}
        className="space-y-2"
        aria-label="Tipo de benefício"
      >
        {OPCOES.map(({ value: v, label, descricao, Icon }) => (
          <RadioGroupPrimitive.Item
            key={v}
            value={v}
            onClick={v === 'mandado_seguranca' && value === 'mandado_seguranca' ? abrirModal : undefined}
            className={cn(
              'group w-full rounded-2xl border border-border bg-card text-left transition-all',
              'hover:border-primary/40 hover:bg-accent/30',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'data-[state=checked]:border-primary data-[state=checked]:bg-primary/5',
            )}
          >
            <div className="flex items-start gap-3 px-4 py-3.5">
              <div className={cn(
                'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl',
                'bg-secondary text-muted-foreground transition-colors',
                'group-data-[state=checked]:bg-primary/10 group-data-[state=checked]:text-primary',
              )}>
                <Icon className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'text-sm font-medium text-foreground transition-colors',
                  'group-data-[state=checked]:text-primary',
                )}>
                  {label}
                  {v === 'mandado_seguranca' && value === 'mandado_seguranca' && msOrgao && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      — em face do {msOrgao.toUpperCase()}
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{descricao}</p>
              </div>
              <div className={cn(
                'mt-1 size-4 shrink-0 rounded-full border-2 transition-all',
                'border-border group-data-[state=checked]:border-primary group-data-[state=checked]:bg-primary',
              )} />
            </div>
          </RadioGroupPrimitive.Item>
        ))}
      </RadioGroupPrimitive.Root>

      <Dialog open={modalAberto} onOpenChange={(open) => { if (!open) setModalAberto(false); }}>
        <DialogContent showCloseButton={false} className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Em face de qual órgão?</DialogTitle>
            <DialogDescription>
              Selecione a autoridade coatora para o Mandado de Segurança.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-1">
            {ORGAOS.map(({ value: ov, label, descricao, Icon }) => (
              <button
                key={ov}
                type="button"
                onClick={() => setOrgaoLocal(ov)}
                className={cn(
                  'w-full rounded-2xl border border-border bg-card text-left transition-all',
                  'hover:border-primary/40 hover:bg-accent/30',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  orgaoLocal === ov && 'border-primary bg-primary/5',
                )}
              >
                <div className="flex items-start gap-3 px-4 py-3.5">
                  <div className={cn(
                    'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl',
                    'bg-secondary text-muted-foreground transition-colors',
                    orgaoLocal === ov && 'bg-primary/10 text-primary',
                  )}>
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-sm font-medium text-foreground transition-colors',
                      orgaoLocal === ov && 'text-primary',
                    )}>
                      {label}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{descricao}</p>
                  </div>
                  <div className={cn(
                    'mt-1 size-4 shrink-0 rounded-full border-2 transition-all',
                    orgaoLocal === ov ? 'border-primary bg-primary' : 'border-border',
                  )} />
                </div>
              </button>
            ))}
          </div>

          <DialogFooter>
            <Button
              onClick={confirmarOrgao}
              disabled={!orgaoLocal}
              className="w-full rounded-xl"
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="sticky bottom-0 -mx-4 px-4 pb-4 pt-3 bg-background/80 backdrop-blur-sm border-t border-border">
        <div className="flex justify-end">
          <Button onClick={handleAvancar} disabled={!value} className="rounded-xl">
            Avançar
          </Button>
        </div>
      </div>
    </div>
  );
}

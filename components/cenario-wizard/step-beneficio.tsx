'use client';

import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';
import { Briefcase, Scale, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
];

type Props = {
  value: BeneficioId | null;
  onChange: (b: BeneficioId) => void;
  onNext: () => void;
};

export function StepBeneficio({ value, onChange, onNext }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-foreground">Qual é o benefício?</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">Selecione o tipo de ação para este cliente.</p>
      </div>

      <RadioGroupPrimitive.Root
        value={value ?? ''}
        onValueChange={(v) => onChange(v as BeneficioId)}
        className="space-y-2"
        aria-label="Tipo de benefício"
      >
        {OPCOES.map(({ value: v, label, descricao, Icon }) => (
          <RadioGroupPrimitive.Item
            key={v}
            value={v}
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
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{descricao}</p>
              </div>
              {/* Indicador visual */}
              <div className={cn(
                'mt-1 size-4 shrink-0 rounded-full border-2 transition-all',
                'border-border group-data-[state=checked]:border-primary group-data-[state=checked]:bg-primary',
              )} />
            </div>
          </RadioGroupPrimitive.Item>
        ))}
      </RadioGroupPrimitive.Root>

      <div className="sticky bottom-0 -mx-4 px-4 pb-4 pt-3 bg-background/80 backdrop-blur-sm border-t border-border">
        <div className="flex justify-end">
          <Button onClick={onNext} disabled={!value} className="rounded-xl">
            Avançar
          </Button>
        </div>
      </div>
    </div>
  );
}

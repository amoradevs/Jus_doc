'use client';

import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';
import { User, PenLine, Baby, PersonStanding, UserCog, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { PerfilId } from '@/lib/document-generation/cadeia-documental';

const PERFIS_MENORES: PerfilId[] = ['menor_impubere', 'menor_pubere', 'incapaz_curador'];

const OPCOES: { value: PerfilId; label: string; descricao: string; Icon: React.ElementType }[] = [
  {
    value: 'adulto_capaz',
    label: 'Adulto capaz',
    descricao: 'Maior de 18 anos, assina o próprio contrato.',
    Icon: User,
  },
  {
    value: 'a_rogo',
    label: 'A rogo',
    descricao: 'Adulto que não sabe ou não pode assinar — duas testemunhas necessárias.',
    Icon: PenLine,
  },
  {
    value: 'menor_impubere',
    label: 'Menor impúbere',
    descricao: 'Menor de 16 anos — representado pelo responsável legal.',
    Icon: Baby,
  },
  {
    value: 'menor_pubere',
    label: 'Menor púbere',
    descricao: 'Entre 16 e 18 anos — assiste com representante legal.',
    Icon: PersonStanding,
  },
  {
    value: 'incapaz_curador',
    label: 'Incapaz com curador',
    descricao: 'Pessoa maior interditada — representada pelo curador.',
    Icon: UserCog,
  },
];

type Props = {
  value: PerfilId | null;
  onChange: (p: PerfilId) => void;
  onNext: () => void;
  onBack: () => void;
};

export function StepPerfil({ value, onChange, onNext, onBack }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-foreground">Qual é o perfil do contratante?</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">Determina o tipo de assinatura e representação.</p>
      </div>

      <RadioGroupPrimitive.Root
        value={value ?? ''}
        onValueChange={(v) => onChange(v as PerfilId)}
        className="space-y-2"
        aria-label="Perfil do contratante"
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
            <div className="flex items-center gap-3 px-4 py-3">
              <div className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-xl',
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
                <p className="text-xs text-muted-foreground">{descricao}</p>
              </div>
              <div className={cn(
                'size-4 shrink-0 rounded-full border-2 transition-all',
                'border-border group-data-[state=checked]:border-primary group-data-[state=checked]:bg-primary',
              )} />
            </div>
          </RadioGroupPrimitive.Item>
        ))}
      </RadioGroupPrimitive.Root>

      {value && PERFIS_MENORES.includes(value) && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
          <Info className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <p className="text-xs text-primary leading-relaxed">
            Este perfil exige <strong>representante legal</strong> — o gatilho correspondente será ativado automaticamente na próxima etapa.
          </p>
        </div>
      )}

      <div className="sticky bottom-0 -mx-4 px-4 pb-4 pt-3 bg-background/80 backdrop-blur-sm border-t border-border">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onBack} className="rounded-xl">Voltar</Button>
          <Button onClick={onNext} disabled={!value} className="rounded-xl">Avançar</Button>
        </div>
      </div>
    </div>
  );
}

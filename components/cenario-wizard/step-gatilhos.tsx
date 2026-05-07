'use client';

import { Home, Building2, HeartCrack } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { GatilhoId } from '@/lib/document-generation/cadeia-documental';

const OPCOES: { value: GatilhoId; label: string; descricao: string; Icon: React.ElementType }[] = [
  {
    value: 'imovel_terceiro',
    label: 'Imóvel de terceiro',
    descricao: 'O cliente reside em imóvel cedido — gera Declaração de Residência.',
    Icon: Home,
  },
  {
    value: 'mei_inativo',
    label: 'MEI inativo',
    descricao: 'O cliente possui MEI sem atividade — gera Declaração de Inatividade de Empresa.',
    Icon: Building2,
  },
  {
    value: 'separado_de_fato',
    label: 'Separado de fato',
    descricao: 'Separação não formalizada — gera Declaração de Separação de Fato (BPC).',
    Icon: HeartCrack,
  },
];

type Props = {
  value: GatilhoId[];
  onChange: (g: GatilhoId[]) => void;
  onNext: () => void;
  onBack: () => void;
};

export function StepGatilhos({ value, onChange, onNext, onBack }: Props) {
  function toggle(gatilho: GatilhoId) {
    onChange(
      value.includes(gatilho)
        ? value.filter((g) => g !== gatilho)
        : [...value, gatilho],
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-foreground">Situações específicas</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Selecione as situações que se aplicam ao caso. Se nenhuma se aplicar, pode avançar diretamente.
        </p>
      </div>

      <div className="space-y-2">
        {OPCOES.map(({ value: v, label, descricao, Icon }) => {
          const checked = value.includes(v);
          return (
            <label
              key={v}
              htmlFor={`gatilho-${v}`}
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3.5 transition-all ${
                checked
                  ? 'border-primary/40 bg-primary/5'
                  : 'border-border bg-card hover:border-primary/30 hover:bg-accent/30'
              }`}
            >
              <Checkbox
                id={`gatilho-${v}`}
                checked={checked}
                onCheckedChange={() => toggle(v)}
                className="mt-0.5 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <Icon className="size-3.5 text-muted-foreground shrink-0" />
                  <Label
                    htmlFor={`gatilho-${v}`}
                    className="cursor-pointer text-sm font-medium text-foreground"
                  >
                    {label}
                  </Label>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{descricao}</p>
              </div>
            </label>
          );
        })}
      </div>

      <div className="sticky bottom-0 -mx-4 px-4 pb-4 pt-3 bg-background/80 backdrop-blur-sm border-t border-border">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onBack} className="rounded-xl">Voltar</Button>
          <Button onClick={onNext} className="rounded-xl">Avançar</Button>
        </div>
      </div>
    </div>
  );
}

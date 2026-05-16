'use client';

import { Home, Building2, HeartCrack, Users, CheckCircle2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { GatilhoId, BeneficioId } from '@/lib/document-generation/cadeia-documental';

const TODAS_OPCOES: { value: GatilhoId; label: string; descricao: string; Icon: React.ElementType; beneficios?: BeneficioId[] }[] = [
  {
    value: 'imovel_terceiro',
    label: 'Imóvel de terceiro',
    descricao: 'O cliente reside em imóvel cedido — gera Declaração de Residência.',
    Icon: Home,
    beneficios: ['bpc', 'aposentadoria_idade'],
  },
  {
    value: 'mei_inativo',
    label: 'MEI inativo',
    descricao: 'O cliente possui MEI sem atividade — gera Declaração de Inatividade de Empresa.',
    Icon: Building2,
    beneficios: ['bpc', 'aposentadoria_idade', 'mandado_seguranca'],
  },
  {
    value: 'separado_de_fato',
    label: 'Separado de fato',
    descricao: 'Separação não formalizada — gera Declaração de Separação de Fato (BPC).',
    Icon: HeartCrack,
    beneficios: ['bpc'],
  },
  {
    value: 'tem_representacao_legal',
    label: 'Há representação legal',
    descricao: 'Dependente é menor ou incapaz com representante legal — gera Termo de Responsabilidade.',
    Icon: Users,
  },
];

type Props = {
  value: GatilhoId[];
  onChange: (g: GatilhoId[]) => void;
  onNext: () => void;
  onBack: () => void;
  beneficio?: BeneficioId | null;
};

export function StepGatilhos({ value, onChange, onNext, onBack, beneficio }: Props) {
  const OPCOES = TODAS_OPCOES.filter(
    (o) => !o.beneficios || !beneficio || o.beneficios.includes(beneficio),
  );

  function toggle(gatilho: GatilhoId) {
    onChange(
      value.includes(gatilho)
        ? value.filter((g) => g !== gatilho)
        : [...value, gatilho],
    );
  }

  const isNenhumaChecked = value.length === 0;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-foreground">Situações específicas</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Selecione as situações que se aplicam ao caso ou confirme que nenhuma se aplica.
        </p>
      </div>

      <div className="space-y-2">
        {/* Opção padrão — pré-selecionada quando nenhum gatilho está ativo */}
        <label
          htmlFor="gatilho-nenhuma"
          className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3.5 transition-all ${
            isNenhumaChecked
              ? 'border-primary/40 bg-primary/5'
              : 'border-border bg-card hover:border-primary/30 hover:bg-accent/30'
          }`}
        >
          <Checkbox
            id="gatilho-nenhuma"
            checked={isNenhumaChecked}
            onCheckedChange={() => onChange([])}
            className="mt-0.5 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-muted-foreground shrink-0" />
              <Label
                htmlFor="gatilho-nenhuma"
                className="cursor-pointer text-sm font-medium text-foreground"
              >
                Nenhuma situação especial
              </Label>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              O caso segue o fluxo padrão — sem documentos adicionais.
            </p>
          </div>
        </label>

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

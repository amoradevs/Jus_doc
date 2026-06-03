# Modificações — Sessão de Implementação

> Documento gerado para replicação idêntica em outro sistema.
> Aplique cada seção na ordem indicada. Para arquivos com conteúdo completo, substitua o arquivo inteiro. Para arquivos com diff, aplique apenas as seções indicadas.

---

## Visão geral das mudanças

| # | Arquivo / Recurso | Tipo de mudança |
|---|---|---|
| 1 | `lib/document-generation/cadeia-documental.ts` | Edição parcial |
| 2 | `lib/document-generation/template-context.ts` | Edição parcial |
| 3 | `lib/document-generation/docx-renderer.ts` | Edição parcial |
| 4 | `components/cenario-wizard/step-beneficio.tsx` | Substituição completa |
| 5 | `components/cenario-wizard/wizard-cenario.tsx` | Edição parcial |
| 6 | `components/cenario-wizard/step-gatilhos.tsx` | Substituição completa |
| 7 | `lib/document-generation/render-termo-representacao-inss.ts` | Edição parcial |
| 8 | Template DOCX `03_03_declaracao_hipossuficiencia.docx` | Modificação via Python |
| 9 | Templates DOCX 01, 02, 03, 04, 07 | RG condicional via Python |
| 10 | Template DOCX `06_06_declaracao_separacao.docx` | Logo INSS via Python |
| 11 | Template DOCX `07_07_declaracao_inatividade_mei.docx` | Novo template (criar manualmente) |

---

## 1. `lib/document-generation/cadeia-documental.ts`

### 1.1 — Adicionar `ms_orgao` à interface `Cenario`

**Localizar:**
```typescript
export interface Cenario {
  beneficio: BeneficioId;
  perfil: PerfilId;
  gatilhos: GatilhoId[];
  ms_orgao?: 'inss' | 'cras';
}
```

Se a linha `ms_orgao` não existir, adicionar após `gatilhos: GatilhoId[];`.

---

### 1.2 — Template 01 (Contrato de Honorários): remover `mandado_seguranca`

**Localizar e substituir:**
```typescript
// ANTES:
beneficios: ['bpc', 'aposentadoria_idade', 'mandado_seguranca', 'pensao_morte'],

// DEPOIS:
beneficios: ['bpc', 'aposentadoria_idade', 'pensao_morte'],
```

Aplicar apenas no bloco do template com `codigo: '01'`.

---

### 1.3 — Template 03 (Declaração de Hipossuficiência): restringir benefícios

**Localizar no bloco `codigo: '03'` e substituir:**
```typescript
// ANTES:
beneficios: [],

// DEPOIS:
beneficios: ['bpc', 'aposentadoria_idade', 'pensao_morte'],
```

---

### 1.4 — Template 15 (Termo de Responsabilidade): remover `mandado_seguranca`

**Localizar no bloco `codigo: '15'` e substituir:**
```typescript
// ANTES:
beneficios: ['bpc', 'mandado_seguranca', 'pensao_morte'],

// DEPOIS:
beneficios: ['bpc', 'pensao_morte'],
```

Atualizar também o comentário acima para:
```typescript
// Ativado pelo gatilho tem_representacao_legal — não se aplica à aposentadoria por idade nem ao MS
```

---

### 1.5 — Template 06 (Separação de Fato): restringir benefícios

**Localizar no bloco `codigo: '06'` e substituir:**
```typescript
// ANTES:
beneficios: [],

// DEPOIS:
beneficios: ['bpc', 'aposentadoria_idade', 'pensao_morte'],
```

---

### 1.6 — Template 07 (MEI Inativo): restringir benefícios

**Localizar no bloco `codigo: '07'` e substituir:**
```typescript
// ANTES:
beneficios: [],

// DEPOIS:
beneficios: ['bpc', 'aposentadoria_idade', 'pensao_morte'],
```

Se o template 07 não existir no catálogo, adicionar ao array `CATALOGO_TEMPLATES` após o bloco do template 06:
```typescript
{
  codigo: '07',
  categoria: 'declaracao',
  nome: 'Declaração de Inatividade de Empresa',
  beneficios: ['bpc', 'aposentadoria_idade', 'pensao_morte'],
  perfis: [],
  gatilhos: ['mei_inativo'],
  obrigatorio: false,
  ordem: 8,
},
```

E adicionar `'mei_inativo'` ao tipo `GatilhoId` se não existir:
```typescript
export type GatilhoId =
  | 'imovel_terceiro'
  | 'mei_inativo'
  | 'separado_de_fato'
  | 'tem_representacao_legal';
```

---

## 2. `lib/document-generation/template-context.ts`

### 2.1 — Imports e logo base64 no topo do arquivo

Logo após os imports existentes, antes de qualquer função, adicionar:

```typescript
import fs from 'fs';
import path from 'path';
```

Se já existirem, pular.

Adicionar a função e constante de logo (logo após os imports):
```typescript
// Lido uma vez no startup — evita leitura de filesystem no Vercel em runtime.
function loadLogoBase64(filePath: string): string {
  try {
    const buf = fs.readFileSync(path.resolve(process.cwd(), filePath));
    return `data:image/png;base64,${buf.toString('base64')}`;
  } catch {
    return '';
  }
}

const LOGO_INSS_BASE64 = loadLogoBase64('templates/inss-logo.png');
```

---

### 2.2 — Adicionar `logo_inss` ao tipo `TemplateContext`

Localizar a definição do tipo `TemplateContext` e adicionar ao final, antes do `};`:
```typescript
logo_inss: string;
```

---

### 2.3 — Adicionar `logo_inss` ao `baseContext`

No objeto `baseContext` dentro de `buildTemplateContext`, localizar a última propriedade e adicionar:
```typescript
logo_inss: LOGO_INSS_BASE64,
```

---

### 2.4 — Override de `objeto_procuracao` para MS/CRAS em `getCenarioContextOverrides`

Localizar dentro de `getCenarioContextOverrides`:
```typescript
const benInfo = BENEFICIO_ID_MAP[cenario.beneficio] ?? BENEFICIO_ID_MAP.bpc;
```

Adicionar logo após:
```typescript
let objetoProcuracao = benInfo.objeto;
if (ehMS && cenario.ms_orgao === 'cras') {
  objetoProcuracao = 'impetrar MANDADO DE SEGURANÇA em face do CRAS (Centro de Referência de Assistência Social)';
}
```

Localizar no return do mesmo function:
```typescript
processo: {
  tipo_beneficio_descricao: benInfo.descricao,
  objeto_procuracao: benInfo.objeto,
  eh_pensao_morte: ehPensaoMorte,
},
```

Substituir por:
```typescript
processo: {
  tipo_beneficio_descricao: benInfo.descricao,
  objeto_procuracao: objetoProcuracao,
  eh_pensao_morte: ehPensaoMorte,
},
```

---

### 2.5 — Garantir entrada de `mandado_seguranca` no `BENEFICIO_ID_MAP`

Verificar se existe. Se não, adicionar:
```typescript
mandado_seguranca: {
  descricao: 'IMPETRAÇÃO DE MANDADO DE SEGURANÇA',
  objeto: 'impetrar MANDADO DE SEGURANÇA em face do INSS (Instituto Nacional do Seguro Social)',
  marcados: [],
},
```

---

## 3. `lib/document-generation/docx-renderer.ts`

### 3.1 — `IMAGE_SIZES` e suporte a base64 em `getImage`

Localizar a definição da função `makeImageModule` (ou criá-la se não existir). Adicionar antes dela:

```typescript
const IMAGE_SIZES: Record<string, [number, number]> = {
  logo_inss: [480, 165],
};
```

Localizar a função `makeImageModule` e garantir que `getImage` suporte `data:` URLs e `getSize` use `IMAGE_SIZES`:

```typescript
function makeImageModule() {
  return new ImageModule({
    centered: false,
    getImage: (tagValue: string) => {
      if (tagValue.startsWith('data:')) {
        const base64 = tagValue.split(',')[1];
        return Buffer.from(base64, 'base64');
      }
      const imgPath = path.resolve(process.cwd(), tagValue);
      return fs.readFileSync(imgPath);
    },
    getSize: (_img: Buffer, _tagValue: string, tagName: string) =>
      IMAGE_SIZES[tagName] ?? [180, 50],
  });
}
```

---

## 4. `components/cenario-wizard/step-beneficio.tsx`

**Substituir o arquivo inteiro pelo conteúdo abaixo:**

```tsx
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
```

---

## 5. `components/cenario-wizard/wizard-cenario.tsx`

### 5.1 — Adicionar estado `msOrgao`

Localizar os estados no início de `WizardCenario`:
```typescript
const [beneficio, setBeneficio] = useState<BeneficioId | null>(null);
```

Adicionar logo após:
```typescript
const [msOrgao, setMsOrgao] = useState<'inss' | 'cras' | null>(null);
```

---

### 5.2 — Resetar `msOrgao` ao mudar benefício

Localizar `handleBeneficioChange` e adicionar o reset:
```typescript
function handleBeneficioChange(b: BeneficioId) {
  if (b !== beneficio) {
    setPerfil(null);
    setGatilhos([]);
    setPacote(null);
    setCodigosAtivos([]);
    setMsOrgao(null); // <- adicionar esta linha
  }
  setBeneficio(b);
}
```

---

### 5.3 — Incluir `ms_orgao` no cenário

Localizar `irParaConfirmacao`:
```typescript
// ANTES:
const cenario = { beneficio, perfil, gatilhos };

// DEPOIS:
const cenario = { beneficio, perfil, gatilhos, ...(msOrgao ? { ms_orgao: msOrgao } : {}) };
```

---

### 5.4 — Passar `msOrgao` para `StepBeneficio`

Localizar o render do `StepBeneficio` e adicionar as novas props:
```typescript
// ANTES:
<StepBeneficio
  value={beneficio}
  onChange={handleBeneficioChange}
  onNext={() => irParaPasso(2)}
/>

// DEPOIS:
<StepBeneficio
  value={beneficio}
  onChange={handleBeneficioChange}
  onNext={() => irParaPasso(2)}
  msOrgao={msOrgao}
  onMsOrgaoChange={setMsOrgao}
/>
```

---

## 6. `components/cenario-wizard/step-gatilhos.tsx`

**Substituir o arquivo inteiro pelo conteúdo abaixo:**

```tsx
'use client';

import { useRef, useState } from 'react';
import { Home, Building2, HeartCrack, Users, CheckCircle2, Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import type { GatilhoId, BeneficioId, PerfilId } from '@/lib/document-generation/cadeia-documental';
import { PERFIS_MENORES } from '@/lib/document-generation/cadeia-documental';

type OpcaoGatilho = {
  value: GatilhoId;
  label: string;
  descricao: string;
  Icon: React.ElementType;
  beneficios?: BeneficioId[];
  perfis_excluidos?: PerfilId[];
};

const TODAS_OPCOES: OpcaoGatilho[] = [
  {
    value: 'imovel_terceiro',
    label: 'Imóvel de terceiro',
    descricao: 'O cliente reside em imóvel cedido — gera Declaração de Residência.',
    Icon: Home,
    beneficios: ['bpc', 'aposentadoria_idade', 'pensao_morte'],
  },
  {
    value: 'mei_inativo',
    label: 'MEI inativo',
    descricao: 'O cliente possui MEI sem atividade — gera Declaração de Inatividade de Empresa.',
    Icon: Building2,
    beneficios: ['bpc', 'aposentadoria_idade', 'mandado_seguranca'],
    perfis_excluidos: ['menor_impubere', 'menor_pubere'] as PerfilId[],
  },
  {
    value: 'separado_de_fato',
    label: 'Separado de fato',
    descricao: 'Separação não formalizada — gera Declaração de Separação de Fato.',
    Icon: HeartCrack,
    perfis_excluidos: ['menor_impubere', 'menor_pubere'],
  },
  {
    value: 'tem_representacao_legal',
    label: 'Há representação legal',
    descricao: 'Dependente é menor ou incapaz com representante legal — gera Termo de Responsabilidade.',
    Icon: Users,
    beneficios: ['bpc', 'mandado_seguranca', 'pensao_morte'] as BeneficioId[],
  },
];

type Props = {
  clientId: string;
  value: GatilhoId[];
  onChange: (g: GatilhoId[]) => void;
  onNext: () => void;
  onBack: () => void;
  beneficio?: BeneficioId | null;
  perfil?: PerfilId | null;
};

export function StepGatilhos({ clientId, value, onChange, onNext, onBack, beneficio, perfil }: Props) {
  const perfilEhMenor = perfil !== null && perfil !== undefined && PERFIS_MENORES.includes(perfil);

  const OPCOES = TODAS_OPCOES.filter((o) => {
    if (o.beneficios && beneficio && !o.beneficios.includes(beneficio)) return false;
    if (o.perfis_excluidos && perfil && o.perfis_excluidos.includes(perfil)) return false;
    return true;
  });

  // ── Modal — proprietário do imóvel ──────────────────────────────────────────
  const [modalImovelAberto, setModalImovelAberto] = useState(false);
  const [nomeProprietario, setNomeProprietario] = useState('');
  const [salvandoImovel, setSalvandoImovel] = useState(false);
  const inputImovelRef = useRef<HTMLInputElement>(null);

  // ── Modal — MEI inativo ──────────────────────────────────────────────────────
  const [modalMeiAberto, setModalMeiAberto] = useState(false);
  const [meiCnpj, setMeiCnpj] = useState('');
  const [meiRazaoSocial, setMeiRazaoSocial] = useState('');
  const [meiRamo, setMeiRamo] = useState('');
  const [meiCnae, setMeiCnae] = useState('');
  const [meiDataAbertura, setMeiDataAbertura] = useState('');
  const [meiDataInatividade, setMeiDataInatividade] = useState('');
  const [salvandoMei, setSalvandoMei] = useState(false);
  const inputMeiCnpjRef = useRef<HTMLInputElement>(null);

  // ── Modal — separação de fato ────────────────────────────────────────────────
  const [modalSepAberto, setModalSepAberto] = useState(false);
  const [sepConjugeNome, setSepConjugeNome] = useState('');
  const [sepConjugeNasc, setSepConjugeNasc] = useState('');
  const [sepRecebePensao, setSepRecebePensao] = useState(false);
  const [sepValorPensao, setSepValorPensao] = useState('');
  const [salvandoSep, setSalvandoSep] = useState(false);
  const inputSepNomeRef = useRef<HTMLInputElement>(null);

  function toggle(gatilho: GatilhoId) {
    if (gatilho === 'tem_representacao_legal' && perfilEhMenor) return;

    if (gatilho === 'imovel_terceiro') {
      if (value.includes('imovel_terceiro')) {
        onChange(value.filter((g) => g !== 'imovel_terceiro'));
      } else {
        setNomeProprietario('');
        setModalImovelAberto(true);
      }
      return;
    }

    if (gatilho === 'mei_inativo') {
      if (value.includes('mei_inativo')) {
        onChange(value.filter((g) => g !== 'mei_inativo'));
      } else {
        setMeiCnpj('');
        setMeiRazaoSocial('');
        setMeiRamo('');
        setMeiCnae('');
        setMeiDataAbertura('');
        setMeiDataInatividade('');
        setModalMeiAberto(true);
      }
      return;
    }

    if (gatilho === 'separado_de_fato') {
      if (value.includes('separado_de_fato')) {
        onChange(value.filter((g) => g !== 'separado_de_fato'));
      } else {
        setSepConjugeNome('');
        setSepConjugeNasc('');
        setSepRecebePensao(false);
        setSepValorPensao('');
        setModalSepAberto(true);
      }
      return;
    }

    onChange(
      value.includes(gatilho)
        ? value.filter((g) => g !== gatilho)
        : [...value, gatilho],
    );
  }

  // ── Imovel handlers ─────────────────────────────────────────────────────────

  async function confirmarProprietario() {
    const nome = nomeProprietario.trim();
    if (!nome || salvandoImovel) return;
    setSalvandoImovel(true);
    try {
      await fetch(`/api/clientes/${clientId}/contextual-data`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imovel: { proprietario_nome: nome, cedido: true } }),
      });
      onChange([...value, 'imovel_terceiro']);
      setModalImovelAberto(false);
    } finally {
      setSalvandoImovel(false);
    }
  }

  // ── Separação handlers ───────────────────────────────────────────────────────

  function podeSalvarSep() {
    return sepConjugeNome.trim() && sepConjugeNasc.trim() &&
      (!sepRecebePensao || sepValorPensao.trim());
  }

  async function confirmarSeparacao() {
    if (!podeSalvarSep() || salvandoSep) return;
    setSalvandoSep(true);
    try {
      await fetch(`/api/clientes/${clientId}/contextual-data`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conjuge: {
            nome_completo: sepConjugeNome.trim(),
            data_nascimento: sepConjugeNasc,
            recebe_pensao: sepRecebePensao,
            valor_pensao: sepRecebePensao ? sepValorPensao.trim() : '',
          },
        }),
      });
      onChange([...value, 'separado_de_fato']);
      setModalSepAberto(false);
    } finally {
      setSalvandoSep(false);
    }
  }

  // ── MEI handlers ────────────────────────────────────────────────────────────

  function podeSalvarMei() {
    return meiCnpj.trim() && meiRazaoSocial.trim() && meiRamo.trim() &&
      meiCnae.trim() && meiDataAbertura.trim() && meiDataInatividade.trim();
  }

  async function confirmarMei() {
    if (!podeSalvarMei() || salvandoMei) return;
    setSalvandoMei(true);
    try {
      await fetch(`/api/clientes/${clientId}/contextual-data`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresa_mei: {
            cnpj: meiCnpj.trim(),
            razao_social: meiRazaoSocial.trim(),
            ramo: meiRamo.trim(),
            cnae: meiCnae.trim(),
            data_abertura: meiDataAbertura,
            data_inicio_inatividade: meiDataInatividade,
          },
        }),
      });
      onChange([...value, 'mei_inativo']);
      setModalMeiAberto(false);
    } finally {
      setSalvandoMei(false);
    }
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
        {!perfilEhMenor && (
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
        )}

        {OPCOES.map(({ value: v, label, descricao, Icon }) => {
          const checked = value.includes(v);
          const travado = v === 'tem_representacao_legal' && perfilEhMenor;
          return (
            <label
              key={v}
              htmlFor={`gatilho-${v}`}
              className={`flex items-start gap-3 rounded-2xl border px-4 py-3.5 transition-all ${
                travado
                  ? 'cursor-not-allowed border-primary/40 bg-primary/5 opacity-80'
                  : checked
                  ? 'cursor-pointer border-primary/40 bg-primary/5'
                  : 'cursor-pointer border-border bg-card hover:border-primary/30 hover:bg-accent/30'
              }`}
            >
              <Checkbox
                id={`gatilho-${v}`}
                checked={checked}
                onCheckedChange={() => toggle(v)}
                disabled={travado}
                className="mt-0.5 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <Icon className="size-3.5 text-muted-foreground shrink-0" />
                  <Label
                    htmlFor={`gatilho-${v}`}
                    className={`text-sm font-medium text-foreground ${travado ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {label}
                  </Label>
                  {travado && (
                    <span className="text-xs text-primary font-medium">obrigatório</span>
                  )}
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

      {/* ── Modal — MEI inativo ── */}
      <Dialog open={modalMeiAberto} onOpenChange={(open) => { if (!salvandoMei) setModalMeiAberto(open); }}>
        <DialogContent
          className="sm:max-w-md"
          onOpenAutoFocus={(e) => { e.preventDefault(); inputMeiCnpjRef.current?.focus(); }}
        >
          <DialogHeader>
            <DialogTitle>Dados do MEI inativo</DialogTitle>
            <DialogDescription>
              Informações para preencher a Declaração de Inatividade de Empresa.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">CNPJ</Label>
              <Input
                ref={inputMeiCnpjRef}
                placeholder="Ex: 55.844.121/0001-01"
                value={meiCnpj}
                onChange={(e) => setMeiCnpj(e.target.value)}
                disabled={salvandoMei}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Razão Social</Label>
              <Input
                placeholder="Nome completo conforme CNPJ"
                value={meiRazaoSocial}
                onChange={(e) => setMeiRazaoSocial(e.target.value)}
                disabled={salvandoMei}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Ramo de atividade</Label>
              <Input
                placeholder="Ex: Arte e Cultura"
                value={meiRamo}
                onChange={(e) => setMeiRamo(e.target.value)}
                disabled={salvandoMei}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">CNAE</Label>
              <Input
                placeholder="Ex: R-9001-9/02"
                value={meiCnae}
                onChange={(e) => setMeiCnae(e.target.value)}
                disabled={salvandoMei}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Aberta em</Label>
              <Input
                type="date"
                value={meiDataAbertura}
                onChange={(e) => setMeiDataAbertura(e.target.value)}
                disabled={salvandoMei}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Inativa desde</Label>
              <Input
                type="date"
                value={meiDataInatividade}
                onChange={(e) => setMeiDataInatividade(e.target.value)}
                disabled={salvandoMei}
                className="rounded-xl"
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="rounded-xl" disabled={salvandoMei}>Cancelar</Button>
            </DialogClose>
            <Button
              className="rounded-xl gap-2"
              onClick={confirmarMei}
              disabled={!podeSalvarMei() || salvandoMei}
            >
              {salvandoMei && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal — proprietário do imóvel ── */}
      <Dialog open={modalImovelAberto} onOpenChange={(open) => { if (!salvandoImovel) setModalImovelAberto(open); }}>
        <DialogContent
          className="sm:max-w-sm"
          onOpenAutoFocus={(e) => { e.preventDefault(); inputImovelRef.current?.focus(); }}
        >
          <DialogHeader>
            <DialogTitle>Quem é o proprietário do imóvel?</DialogTitle>
            <DialogDescription>
              O nome será incluído automaticamente na Declaração de Residência.
            </DialogDescription>
          </DialogHeader>
          <div className="py-1">
            <Input
              ref={inputImovelRef}
              placeholder="Nome completo do proprietário"
              value={nomeProprietario}
              onChange={(e) => setNomeProprietario(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') confirmarProprietario(); }}
              disabled={salvandoImovel}
              className="rounded-xl"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="rounded-xl" disabled={salvandoImovel}>Cancelar</Button>
            </DialogClose>
            <Button
              className="rounded-xl gap-2"
              onClick={confirmarProprietario}
              disabled={!nomeProprietario.trim() || salvandoImovel}
            >
              {salvandoImovel && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal — separação de fato ── */}
      <Dialog open={modalSepAberto} onOpenChange={(open) => { if (!salvandoSep) setModalSepAberto(open); }}>
        <DialogContent
          className="sm:max-w-md"
          onOpenAutoFocus={(e) => { e.preventDefault(); inputSepNomeRef.current?.focus(); }}
        >
          <DialogHeader>
            <DialogTitle>Dados da separação de fato</DialogTitle>
            <DialogDescription>
              Informações para preencher a Declaração de Separação de Fato.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Nome do cônjuge / companheiro(a)</Label>
              <Input
                ref={inputSepNomeRef}
                placeholder="Nome completo do Sr./Sra."
                value={sepConjugeNome}
                onChange={(e) => setSepConjugeNome(e.target.value)}
                disabled={salvandoSep}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Data de nascimento do cônjuge</Label>
              <Input
                type="date"
                value={sepConjugeNasc}
                onChange={(e) => setSepConjugeNasc(e.target.value)}
                disabled={salvandoSep}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Pensão alimentícia</Label>
              <div className="flex flex-col gap-2">
                <label className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-all ${!sepRecebePensao ? 'border-primary/40 bg-primary/5' : 'border-border hover:border-primary/30'}`}>
                  <input
                    type="radio"
                    name="pensao"
                    checked={!sepRecebePensao}
                    onChange={() => { setSepRecebePensao(false); setSepValorPensao(''); }}
                    disabled={salvandoSep}
                    className="accent-primary"
                  />
                  <span className="text-sm">Não recebo pensão de alimentos</span>
                </label>
                <label className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-all ${sepRecebePensao ? 'border-primary/40 bg-primary/5' : 'border-border hover:border-primary/30'}`}>
                  <input
                    type="radio"
                    name="pensao"
                    checked={sepRecebePensao}
                    onChange={() => setSepRecebePensao(true)}
                    disabled={salvandoSep}
                    className="accent-primary"
                  />
                  <span className="text-sm">Recebo pensão de alimentos</span>
                </label>
              </div>
            </div>

            {sepRecebePensao && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Valor da pensão (R$)</Label>
                <Input
                  placeholder="Ex: 500,00"
                  value={sepValorPensao}
                  onChange={(e) => setSepValorPensao(e.target.value)}
                  disabled={salvandoSep}
                  className="rounded-xl"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="rounded-xl" disabled={salvandoSep}>Cancelar</Button>
            </DialogClose>
            <Button
              className="rounded-xl gap-2"
              onClick={confirmarSeparacao}
              disabled={!podeSalvarSep() || salvandoSep}
            >
              {salvandoSep && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

---

## 7. `lib/document-generation/render-termo-representacao-inss.ts`

### 7.1 — Bloco de assinatura para menor

Localizar o bloco `else` na seção de assinatura do representado (após o bloco `if (ctx.bloco_assinatura_a_rogo && ctx.testemunhas.length >= 2)`):

```typescript
// ANTES:
} else {
  y -= LH * 2;
}

// DEPOIS:
} else {
  if (ctx.bloco_assinatura_menor) {
    const { parentesco, nome_completo: repNome } = ctx.representante;
    if (parentesco && repNome) {
      const repLine = `${parentesco}: ${repNome}`;
      page.drawText(repLine, { x: sig1X + (155 - tw(repLine, fn, FS_SM)) / 2, y, size: FS_SM, font: fn, color: rgb(0, 0, 0) });
      y -= LH * 0.95;
    }
  }
  y -= LH * 2;
}
```

**Resultado visual:** abaixo de "Assinatura do(a) Representado(a)" aparece `Mãe: Fulana de tal` (sem repetir o nome do cliente).

---

## 8. Template DOCX — Declaração de Hipossuficiência

**Arquivo no Storage:** `templates/03_03_declaracao_hipossuficiencia.docx`

Executar o script Python abaixo (ajustar `SUPABASE_URL` e `TOKEN` para o outro sistema):

```python
import urllib.request, zipfile, io

SUPABASE_URL = 'https://SEU_PROJECT.supabase.co'
TOKEN = 'SEU_SERVICE_KEY'
STORAGE_PATH = 'templates/03_03_declaracao_hipossuficiencia.docx'

# Download
url = f'{SUPABASE_URL}/storage/v1/object/templates/{STORAGE_PATH}'
req = urllib.request.Request(url, headers={'Authorization': f'Bearer {TOKEN}'})
with urllib.request.urlopen(req) as resp:
    data = resp.read()

# Modificar XML
with zipfile.ZipFile(io.BytesIO(data)) as z:
    names = z.namelist()
    xml = z.read('word/document.xml').decode('utf-8')

old = 'Representado(a) por: {representante.nome_completo} — CPF: {representante.cpf}'
new = '{representante.parentesco}: {representante.nome_completo}'
xml_new = xml.replace(old, new)
print('Alterado:', old != xml_new)

# Repack
buf = io.BytesIO()
with zipfile.ZipFile(io.BytesIO(data)) as zin, zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as zout:
    for name in names:
        if name == 'word/document.xml':
            zout.writestr(name, xml_new.encode('utf-8'))
        else:
            zout.writestr(name, zin.read(name))

# Upload
upload_req = urllib.request.Request(
    f'{SUPABASE_URL}/storage/v1/object/templates/{STORAGE_PATH}',
    data=buf.getvalue(),
    method='PUT',
    headers={
        'Authorization': f'Bearer {TOKEN}',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'x-upsert': 'true',
    }
)
with urllib.request.urlopen(upload_req) as resp:
    print('Upload status:', resp.status)
```

**O que muda:** dentro do bloco `{#bloco_contratante_menor}`, a linha de assinatura passa de:
```
Representado(a) por: {representante.nome_completo} — CPF: {representante.cpf}
```
para:
```
{representante.parentesco}: {representante.nome_completo}
```

---

## 9. Templates DOCX — RG condicional (01, 02, 03, 04, 07)

**Regra:** se `{cliente.rg}` estiver vazio, não exibir nada. Se preenchido, exibir `e RG: {cliente.rg} {cliente.rg_orgao_emissor},`.

**Script Python** — executar uma vez para cada template afetado:

```python
import urllib.request, zipfile, io, re

SUPABASE_URL = 'https://SEU_PROJECT.supabase.co'
TOKEN = 'SEU_SERVICE_KEY'

# Executar para cada arquivo:
TEMPLATES = [
    'templates/01_01_contrato_honorarios.docx',
    'templates/02_02_procuracao.docx',
    'templates/03_03_declaracao_hipossuficiencia.docx',
    'templates/04_04_declaracao_residencia.docx',
    'templates/07_07_declaracao_inatividade_mei.docx',
]

OLD_RG = 'e RG: {cliente.rg} {cliente.rg_orgao_emissor},'
NEW_RG = '{#cliente.rg}e RG: {cliente.rg}{#cliente.rg_orgao_emissor} {cliente.rg_orgao_emissor}{/cliente.rg_orgao_emissor},{/cliente.rg}'

for storage_path in TEMPLATES:
    url = f'{SUPABASE_URL}/storage/v1/object/templates/{storage_path}'
    req = urllib.request.Request(url, headers={'Authorization': f'Bearer {TOKEN}'})
    with urllib.request.urlopen(req) as resp:
        data = resp.read()

    with zipfile.ZipFile(io.BytesIO(data)) as z:
        names = z.namelist()
        xml = z.read('word/document.xml').decode('utf-8')

    if OLD_RG not in xml:
        print(f'SKIP (já aplicado ou formato diferente): {storage_path}')
        continue

    xml_new = xml.replace(OLD_RG, NEW_RG)

    buf = io.BytesIO()
    with zipfile.ZipFile(io.BytesIO(data)) as zin, zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as zout:
        for name in names:
            if name == 'word/document.xml':
                zout.writestr(name, xml_new.encode('utf-8'))
            else:
                zout.writestr(name, zin.read(name))

    upload_req = urllib.request.Request(
        f'{SUPABASE_URL}/storage/v1/object/templates/{storage_path}',
        data=buf.getvalue(),
        method='PUT',
        headers={
            'Authorization': f'Bearer {TOKEN}',
            'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'x-upsert': 'true',
        }
    )
    with urllib.request.urlopen(upload_req) as resp:
        print(f'OK {resp.status}: {storage_path}')
```

---

## 10. Template DOCX — Logo INSS na Declaração de Separação de Fato

**Arquivo no Storage:** `templates/06_06_declaracao_separacao.docx`

O template precisa ter a tag `{%logo_inss}` no cabeçalho (início do documento), onde a logo do INSS deve aparecer. Esta tag é processada pelo `docxtemplater-image-module-free`.

Para inserir a tag programaticamente, editar o XML do `word/document.xml` adicionando um parágrafo no início do `<w:body>` com o conteúdo `{%logo_inss}`. O método recomendado é editar o template no Word e inserir a tag manualmente no local correto.

**Garantir que o arquivo `templates/inss-logo.png` existe** na raiz do projeto (necessário para o `loadLogoBase64` funcionar).

---

## 11. Template DOCX — Declaração de Inatividade de MEI (novo)

**Arquivo no Storage:** `templates/07_07_declaracao_inatividade_mei.docx`

Template novo que usa as seguintes tags de contexto:

```
{cliente.nome_completo}
{cliente.cpf}
{cliente.rg}                      ← condicional: {#cliente.rg}...{/cliente.rg}
{cliente.rg_orgao_emissor}
{cliente.data_nascimento}
{cliente.nome_mae}
{endereco.logradouro}, {endereco.numero}{endereco.complemento_formatado}
{endereco.bairro}, {endereco.cidade}/{endereco.uf}, CEP {endereco.cep}
{empresa.cnpj}
{empresa.razao_social}
{empresa.ramo}
{empresa.cnae}
{empresa.data_abertura}
{empresa.data_inicio_inatividade}
{doc.cidade_assinatura}, {doc.dia_assinatura} de {doc.mes_assinatura_extenso} de {doc.ano_assinatura}
```

Criar o template no Word com o layout desejado e fazer upload para o Storage no caminho correto (`templates/07_07_declaracao_inatividade_mei.docx`).

---

## Checklist de verificação após aplicação

- [ ] `npx tsc --noEmit` — zero erros de TypeScript
- [ ] Selecionar BPC/Aposentadoria/Pensão → cadeia mínima sem mudanças
- [ ] Selecionar Mandado de Segurança → modal abre automaticamente com opções INSS/CRAS
- [ ] MS + INSS → procuração gerada com "em face do INSS"
- [ ] MS + CRAS → procuração gerada com "em face do CRAS"
- [ ] MS não gera contrato, hipossuficiência, termo, separação, MEI
- [ ] Gatilho MEI inativo → modal com 6 campos (CNPJ, Razão Social, Ramo, CNAE, Aberta em, Inativa desde)
- [ ] Menor Impúbere / Menor Púbere → Termo de Representação mostra `Mãe: Fulana de tal` abaixo de "Assinatura do(a) Representado(a)"
- [ ] Declaração de Hipossuficiência → bloco menor mostra `Mãe: Fulana de tal` (sem "Representado(a) por:" e sem CPF)
- [ ] RG não preenchido → não aparece em nenhum documento
- [ ] Deploy para produção após confirmar todos os pontos acima

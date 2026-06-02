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

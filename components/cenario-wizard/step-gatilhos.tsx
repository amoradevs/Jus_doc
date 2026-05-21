'use client';

import { useRef, useState } from 'react';
import { Home, Building2, HeartCrack, Users, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
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

function validarCPF(cpf: string): boolean {
  const d = cpf.replace(/\D/g, '');
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(d[i]) * (10 - i);
  let r = (sum * 10) % 11;
  if (r >= 10) r = 0;
  if (r !== Number(d[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(d[i]) * (11 - i);
  r = (sum * 10) % 11;
  if (r >= 10) r = 0;
  return r === Number(d[10]);
}

function mascararCPF(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

type RepErros = { nome?: string; cpf?: string; parentesco?: string };

type Props = {
  clientId: string;
  value: GatilhoId[];
  onChange: (g: GatilhoId[]) => void;
  onNext: () => void;
  onBack: () => void;
  beneficio?: BeneficioId | null;
  perfilEhMenor?: boolean;
};

export function StepGatilhos({ clientId, value, onChange, onNext, onBack, beneficio, perfilEhMenor }: Props) {
  const OPCOES = TODAS_OPCOES.filter(
    (o) => !o.beneficios || !beneficio || o.beneficios.includes(beneficio),
  );

  // ── Modal imóvel ──────────────────────────────────────────────────────────
  const [modalAberto, setModalAberto] = useState(false);
  const [nomeProprietario, setNomeProprietario] = useState('');
  const [salvando, setSalvando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Subformulário representante legal ─────────────────────────────────────
  const [repNome, setRepNome] = useState('');
  const [repCpf, setRepCpf] = useState('');
  const [repRg, setRepRg] = useState('');
  const [repParentesco, setRepParentesco] = useState('');
  const [repErros, setRepErros] = useState<RepErros>({});
  const [salvandoRep, setSalvandoRep] = useState(false);

  const temRepresentacao = value.includes('tem_representacao_legal');

  function toggle(gatilho: GatilhoId) {
    if (gatilho === 'imovel_terceiro') {
      if (value.includes('imovel_terceiro')) {
        onChange(value.filter((g) => g !== 'imovel_terceiro'));
      } else {
        setNomeProprietario('');
        setModalAberto(true);
      }
      return;
    }
    onChange(
      value.includes(gatilho)
        ? value.filter((g) => g !== gatilho)
        : [...value, gatilho],
    );
  }

  async function confirmarProprietario() {
    const nome = nomeProprietario.trim();
    if (!nome || salvando) return;
    setSalvando(true);
    try {
      await fetch(`/api/clientes/${clientId}/contextual-data`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imovel: { proprietario_nome: nome, cedido: true } }),
      });
      onChange([...value, 'imovel_terceiro']);
      setModalAberto(false);
    } finally {
      setSalvando(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') confirmarProprietario();
  }

  async function handleAvancar() {
    if (temRepresentacao) {
      const erros: RepErros = {};
      if (!repNome.trim()) erros.nome = 'Nome obrigatório';
      if (!repCpf.trim()) {
        erros.cpf = 'CPF obrigatório';
      } else if (!validarCPF(repCpf)) {
        erros.cpf = 'CPF inválido — verifique os dígitos';
      }
      if (!repParentesco) erros.parentesco = 'Selecione o parentesco';

      if (Object.keys(erros).length > 0) {
        setRepErros(erros);
        return;
      }

      setSalvandoRep(true);
      try {
        await fetch(`/api/clientes/${clientId}/contextual-data`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            representante_legal: {
              nome_completo: repNome.trim(),
              cpf: repCpf,
              rg: repRg.trim(),
              parentesco: repParentesco,
            },
          }),
        });
        onNext();
      } finally {
        setSalvandoRep(false);
      }
    } else {
      onNext();
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
        {/* Nenhuma situação especial */}
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
              <Label htmlFor="gatilho-nenhuma" className="cursor-pointer text-sm font-medium text-foreground">
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
            <div key={v}>
              <label
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
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Icon className="size-3.5 text-muted-foreground shrink-0" />
                    <Label htmlFor={`gatilho-${v}`} className="cursor-pointer text-sm font-medium text-foreground">
                      {label}
                    </Label>
                    {v === 'tem_representacao_legal' && perfilEhMenor && (
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        Necessário para este perfil
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{descricao}</p>
                </div>
              </label>

              {/* ── Subformulário representante legal ── */}
              {v === 'tem_representacao_legal' && checked && (
                <div className="mt-1 ml-4 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-4 space-y-3">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                    Dados do representante legal
                  </p>

                  {/* Nome completo */}
                  <div className="space-y-1">
                    <Label htmlFor="rep-nome" className="text-xs text-foreground">
                      Nome completo <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="rep-nome"
                      placeholder="Nome completo do representante"
                      value={repNome}
                      onChange={(e) => {
                        setRepNome(e.target.value);
                        if (repErros.nome) setRepErros((prev) => ({ ...prev, nome: undefined }));
                      }}
                      className={`rounded-xl text-sm ${repErros.nome ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    />
                    {repErros.nome && (
                      <p className="flex items-center gap-1 text-xs text-destructive">
                        <AlertCircle className="size-3 shrink-0" />{repErros.nome}
                      </p>
                    )}
                  </div>

                  {/* CPF + RG */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="rep-cpf" className="text-xs text-foreground">
                        CPF <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="rep-cpf"
                        placeholder="000.000.000-00"
                        value={repCpf}
                        onChange={(e) => {
                          setRepCpf(mascararCPF(e.target.value));
                          if (repErros.cpf) setRepErros((prev) => ({ ...prev, cpf: undefined }));
                        }}
                        className={`rounded-xl text-sm ${repErros.cpf ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                      />
                      {repErros.cpf && (
                        <p className="flex items-center gap-1 text-xs text-destructive">
                          <AlertCircle className="size-3 shrink-0" />{repErros.cpf}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="rep-rg" className="text-xs text-foreground">
                        RG <span className="text-muted-foreground">(opcional)</span>
                      </Label>
                      <Input
                        id="rep-rg"
                        placeholder="Número do RG"
                        value={repRg}
                        onChange={(e) => setRepRg(e.target.value)}
                        className="rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  {/* Parentesco */}
                  <div className="space-y-1">
                    <Label htmlFor="rep-parentesco" className="text-xs text-foreground">
                      Parentesco <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={repParentesco}
                      onValueChange={(v) => {
                        setRepParentesco(v);
                        if (repErros.parentesco) setRepErros((prev) => ({ ...prev, parentesco: undefined }));
                      }}
                    >
                      <SelectTrigger
                        id="rep-parentesco"
                        className={`rounded-xl text-sm ${repErros.parentesco ? 'border-destructive focus:ring-destructive' : ''}`}
                      >
                        <SelectValue placeholder="Selecione o parentesco" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Genitora">Genitora</SelectItem>
                        <SelectItem value="Genitor">Genitor</SelectItem>
                        <SelectItem value="Tutora">Tutora</SelectItem>
                        <SelectItem value="Tutor">Tutor</SelectItem>
                        <SelectItem value="Curadora">Curadora</SelectItem>
                        <SelectItem value="Curador">Curador</SelectItem>
                      </SelectContent>
                    </Select>
                    {repErros.parentesco && (
                      <p className="flex items-center gap-1 text-xs text-destructive">
                        <AlertCircle className="size-3 shrink-0" />{repErros.parentesco}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-0 -mx-4 px-4 pb-4 pt-3 bg-background/80 backdrop-blur-sm border-t border-border">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onBack} disabled={salvandoRep} className="rounded-xl">
            Voltar
          </Button>
          <Button onClick={handleAvancar} disabled={salvandoRep} className="gap-2 rounded-xl">
            {salvandoRep && <Loader2 className="size-3.5 animate-spin" />}
            Avançar
          </Button>
        </div>
      </div>

      {/* ── Modal — proprietário do imóvel ── */}
      <Dialog open={modalAberto} onOpenChange={(open) => { if (!salvando) setModalAberto(open); }}>
        <DialogContent
          className="sm:max-w-sm"
          onOpenAutoFocus={(e) => { e.preventDefault(); inputRef.current?.focus(); }}
        >
          <DialogHeader>
            <DialogTitle>Quem é o proprietário do imóvel?</DialogTitle>
            <DialogDescription>
              O nome será incluído automaticamente na Declaração de Residência.
            </DialogDescription>
          </DialogHeader>
          <div className="py-1">
            <Input
              ref={inputRef}
              placeholder="Nome completo do proprietário"
              value={nomeProprietario}
              onChange={(e) => setNomeProprietario(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={salvando}
              className="rounded-xl"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="rounded-xl" disabled={salvando}>
                Cancelar
              </Button>
            </DialogClose>
            <Button
              className="rounded-xl gap-2"
              onClick={confirmarProprietario}
              disabled={!nomeProprietario.trim() || salvando}
            >
              {salvando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

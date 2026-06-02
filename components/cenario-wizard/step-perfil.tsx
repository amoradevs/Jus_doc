'use client';

import { useRef, useState } from 'react';
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';
import { User, PenLine, Baby, PersonStanding, UserCog, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import type { PerfilId, BeneficioId } from '@/lib/document-generation/cadeia-documental';
import { PERFIS_MENORES } from '@/lib/document-generation/cadeia-documental';
import { maskCPF } from '@/lib/validators/cpf';

const TODAS_OPCOES: { value: PerfilId; label: string; descricao: string; Icon: React.ElementType; beneficios?: BeneficioId[] }[] = [
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
    beneficios: ['bpc', 'pensao_morte', 'mandado_seguranca'] as BeneficioId[],
  },
  {
    value: 'menor_pubere',
    label: 'Menor púbere',
    descricao: 'Entre 16 e 18 anos — assiste com representante legal.',
    Icon: PersonStanding,
    beneficios: ['bpc', 'pensao_morte', 'mandado_seguranca'] as BeneficioId[],
  },
  {
    value: 'incapaz_curador',
    label: 'Incapaz com curador',
    descricao: 'Pessoa maior interditada — representada pelo curador.',
    Icon: UserCog,
  },
];

export type Testemunha = {
  nome_completo: string;
  cpf: string;
  rg: string;
  data_nascimento: string;
};

export type RepresentanteLegal = {
  nome_completo: string;
  cpf: string;
  rg: string;
  parentesco: string;
};

export type Validador = {
  nome_completo: string;
  cpf: string;
  rg: string;
};

const TESTEMUNHA_VAZIA: Testemunha = { nome_completo: '', cpf: '', rg: '', data_nascimento: '' };
const REPRESENTANTE_VAZIO: RepresentanteLegal = { nome_completo: '', cpf: '', rg: '', parentesco: '' };
const VALIDADOR_VAZIO: Validador = { nome_completo: '', cpf: '', rg: '' };

type Props = {
  clientId: string;
  beneficio?: BeneficioId | null;
  value: PerfilId | null;
  onChange: (p: PerfilId) => void;
  onNext: () => void;
  onBack: () => void;
  initialTestemunhas?: Testemunha[];
  onTestemunhasSalvas?: (t: Testemunha[]) => void;
  initialRepresentanteLegal?: RepresentanteLegal;
  onRepresentanteLegalSalvo?: (r: RepresentanteLegal) => void;
  initialValidador?: Validador;
  onValidadorSalvo?: (v: Validador) => void;
};

export function StepPerfil({
  clientId, beneficio, value, onChange, onNext, onBack,
  initialTestemunhas, onTestemunhasSalvas,
  initialRepresentanteLegal, onRepresentanteLegalSalvo,
  initialValidador, onValidadorSalvo,
}: Props) {
  const OPCOES = TODAS_OPCOES.filter(
    (o) => !o.beneficios || !beneficio || o.beneficios.includes(beneficio),
  );

  // ── Modal testemunhas (a rogo) ─────────────────────────────────────────────
  const [modalTestemunhasAberto, setModalTestemunhasAberto] = useState(false);
  const [t1, setT1] = useState<Testemunha>(TESTEMUNHA_VAZIA);
  const [t2, setT2] = useState<Testemunha>(TESTEMUNHA_VAZIA);
  const [validador, setValidador] = useState<Validador>(VALIDADOR_VAZIO);

  // ── Modal representante legal (menores/incapaz) ────────────────────────────
  const [modalRepresentanteAberto, setModalRepresentanteAberto] = useState(false);
  const [rep, setRep] = useState<RepresentanteLegal>(REPRESENTANTE_VAZIO);

  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState('');
  const primeiroInputRef = useRef<HTMLInputElement>(null);
  const primeiroInputRepRef = useRef<HTMLInputElement>(null);

  function handleAvancar() {
    if (value === 'a_rogo') {
      const base = initialTestemunhas ?? [];
      setT1(base[0] ?? TESTEMUNHA_VAZIA);
      setT2(base[1] ?? TESTEMUNHA_VAZIA);
      setValidador(initialValidador ?? VALIDADOR_VAZIO);
      setErroSalvar('');
      setModalTestemunhasAberto(true);
    } else if (value && PERFIS_MENORES.includes(value)) {
      setRep(initialRepresentanteLegal ?? REPRESENTANTE_VAZIO);
      setErroSalvar('');
      setModalRepresentanteAberto(true);
    } else {
      onNext();
    }
  }

  // ── Testemunhas ────────────────────────────────────────────────────────────

  function podeSalvarTestemunhas() {
    return (
      validador.nome_completo.trim() && validador.cpf.trim() &&
      t1.nome_completo.trim() && t1.cpf.trim() && t1.data_nascimento &&
      t2.nome_completo.trim() && t2.cpf.trim() && t2.data_nascimento
    );
  }

  async function confirmarTestemunhas() {
    if (!podeSalvarTestemunhas() || salvando) return;
    setSalvando(true);
    setErroSalvar('');
    try {
      const res = await fetch(`/api/clientes/${clientId}/contextual-data`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testemunhas: [t1, t2], validador }),
      });
      if (!res.ok) throw new Error('Falha ao salvar');
      onTestemunhasSalvas?.([t1, t2]);
      onValidadorSalvo?.(validador);
      setModalTestemunhasAberto(false);
      onNext();
    } catch {
      setErroSalvar('Não foi possível salvar os dados. Verifique a conexão e tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  // ── Representante legal ───────────────────────────────────────────────────

  function podeSalvarRepresentante() {
    return rep.nome_completo.trim() && rep.cpf.trim() && rep.parentesco.trim();
  }

  async function confirmarRepresentante() {
    if (!podeSalvarRepresentante() || salvando) return;
    setSalvando(true);
    setErroSalvar('');
    try {
      const res = await fetch(`/api/clientes/${clientId}/contextual-data`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ representante_legal: rep }),
      });
      if (!res.ok) throw new Error('Falha ao salvar');
      onRepresentanteLegalSalvo?.(rep);
      setModalRepresentanteAberto(false);
      onNext();
    } catch {
      setErroSalvar('Não foi possível salvar os dados. Verifique a conexão e tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  function cpfChangeT1(e: React.ChangeEvent<HTMLInputElement>) {
    setT1((prev) => ({ ...prev, cpf: maskCPF(e.target.value) }));
  }
  function cpfChangeT2(e: React.ChangeEvent<HTMLInputElement>) {
    setT2((prev) => ({ ...prev, cpf: maskCPF(e.target.value) }));
  }
  function fieldT1(field: keyof Omit<Testemunha, 'cpf'>) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setT1((prev) => ({ ...prev, [field]: e.target.value }));
  }
  function fieldT2(field: keyof Omit<Testemunha, 'cpf'>) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setT2((prev) => ({ ...prev, [field]: e.target.value }));
  }
  function cpfChangeValidador(e: React.ChangeEvent<HTMLInputElement>) {
    setValidador((prev) => ({ ...prev, cpf: maskCPF(e.target.value) }));
  }
  function fieldValidador(field: keyof Omit<Validador, 'cpf'>) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setValidador((prev) => ({ ...prev, [field]: e.target.value }));
  }
  function cpfChangeRep(e: React.ChangeEvent<HTMLInputElement>) {
    setRep((prev) => ({ ...prev, cpf: maskCPF(e.target.value) }));
  }
  function fieldRep(field: keyof Omit<RepresentanteLegal, 'cpf'>) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setRep((prev) => ({ ...prev, [field]: e.target.value }));
  }

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

      <div className="sticky bottom-0 -mx-4 px-4 pb-4 pt-3 bg-background/80 backdrop-blur-sm border-t border-border">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onBack} className="rounded-xl">Voltar</Button>
          <Button onClick={handleAvancar} disabled={!value} className="rounded-xl">Avançar</Button>
        </div>
      </div>

      {/* ── Modal — testemunhas a rogo ── */}
      <Dialog open={modalTestemunhasAberto} onOpenChange={(open) => { if (!salvando) setModalTestemunhasAberto(open); }}>
        <DialogContent
          className="sm:max-w-md max-h-[90vh] overflow-y-auto"
          onOpenAutoFocus={(e) => { e.preventDefault(); primeiroInputRef.current?.focus(); }}
        >
          <DialogHeader>
            <DialogTitle>Dados do validador e testemunhas</DialogTitle>
            <DialogDescription>
              O perfil &ldquo;A rogo&rdquo; exige um validador da digital e duas testemunhas. Preencha os dados abaixo — eles serão incluídos em todos os documentos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-1">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Quem valida a digital</p>
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium">Nome completo <span className="text-destructive">*</span></label>
                  <Input ref={primeiroInputRef} placeholder="Nome completo" value={validador.nome_completo} onChange={fieldValidador('nome_completo')} disabled={salvando} className="mt-1 rounded-xl" />
                </div>
                <div>
                  <label className="text-sm font-medium">CPF <span className="text-destructive">*</span></label>
                  <Input placeholder="000.000.000-00" value={validador.cpf} onChange={cpfChangeValidador} maxLength={14} disabled={salvando} className="mt-1 rounded-xl" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">RG <span className="text-muted-foreground font-normal">(opcional)</span></label>
                  <Input placeholder="Número do RG" value={validador.rg} onChange={fieldValidador('rg')} disabled={salvando} className="mt-1 rounded-xl" />
                </div>
              </div>
            </div>

            <div className="border-t border-border" />

            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Testemunha 1</p>
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium">Nome completo <span className="text-destructive">*</span></label>
                  <Input placeholder="Nome completo" value={t1.nome_completo} onChange={fieldT1('nome_completo')} disabled={salvando} className="mt-1 rounded-xl" />
                </div>
                <div>
                  <label className="text-sm font-medium">CPF <span className="text-destructive">*</span></label>
                  <Input placeholder="000.000.000-00" value={t1.cpf} onChange={cpfChangeT1} maxLength={14} disabled={salvando} className="mt-1 rounded-xl" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">RG <span className="text-muted-foreground font-normal">(opcional)</span></label>
                  <Input placeholder="Número do RG" value={t1.rg} onChange={fieldT1('rg')} disabled={salvando} className="mt-1 rounded-xl" />
                </div>
                <div>
                  <label className="text-sm font-medium">Data de nascimento <span className="text-destructive">*</span></label>
                  <Input type="date" value={t1.data_nascimento} onChange={fieldT1('data_nascimento')} disabled={salvando} className="mt-1 rounded-xl" />
                </div>
              </div>
            </div>

            <div className="border-t border-border" />

            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Testemunha 2</p>
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium">Nome completo <span className="text-destructive">*</span></label>
                  <Input placeholder="Nome completo" value={t2.nome_completo} onChange={fieldT2('nome_completo')} disabled={salvando} className="mt-1 rounded-xl" />
                </div>
                <div>
                  <label className="text-sm font-medium">CPF <span className="text-destructive">*</span></label>
                  <Input placeholder="000.000.000-00" value={t2.cpf} onChange={cpfChangeT2} maxLength={14} disabled={salvando} className="mt-1 rounded-xl" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">RG <span className="text-muted-foreground font-normal">(opcional)</span></label>
                  <Input placeholder="Número do RG" value={t2.rg} onChange={fieldT2('rg')} disabled={salvando} className="mt-1 rounded-xl" />
                </div>
                <div>
                  <label className="text-sm font-medium">Data de nascimento <span className="text-destructive">*</span></label>
                  <Input type="date" value={t2.data_nascimento} onChange={fieldT2('data_nascimento')} disabled={salvando} className="mt-1 rounded-xl" />
                </div>
              </div>
            </div>

            {erroSalvar && (
              <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30 px-3.5 py-2.5 text-sm text-red-800 dark:text-red-300">
                {erroSalvar}
              </div>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="rounded-xl" disabled={salvando}>Cancelar</Button>
            </DialogClose>
            <Button className="rounded-xl gap-2" onClick={confirmarTestemunhas} disabled={!podeSalvarTestemunhas() || salvando}>
              {salvando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal — representante legal (menores / incapaz) ── */}
      <Dialog open={modalRepresentanteAberto} onOpenChange={(open) => { if (!salvando) setModalRepresentanteAberto(open); }}>
        <DialogContent
          className="sm:max-w-md"
          onOpenAutoFocus={(e) => { e.preventDefault(); primeiroInputRepRef.current?.focus(); }}
        >
          <DialogHeader>
            <DialogTitle>Dados do representante legal</DialogTitle>
            <DialogDescription>
              Preencha os dados de quem representa o cliente — serão incluídos automaticamente nos documentos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1">
            <div>
              <label className="text-sm font-medium">Nome completo <span className="text-destructive">*</span></label>
              <Input
                ref={primeiroInputRepRef}
                placeholder="Nome completo do representante"
                value={rep.nome_completo}
                onChange={fieldRep('nome_completo')}
                disabled={salvando}
                className="mt-1 rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Parentesco / qualidade <span className="text-destructive">*</span></label>
              <Input
                placeholder="Ex: mãe, pai, curador, responsável legal"
                value={rep.parentesco}
                onChange={fieldRep('parentesco')}
                disabled={salvando}
                className="mt-1 rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm font-medium">CPF <span className="text-destructive">*</span></label>
              <Input
                placeholder="000.000.000-00"
                value={rep.cpf}
                onChange={cpfChangeRep}
                maxLength={14}
                disabled={salvando}
                className="mt-1 rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">RG <span className="text-muted-foreground font-normal">(opcional)</span></label>
              <Input
                placeholder="Número do RG"
                value={rep.rg}
                onChange={fieldRep('rg')}
                disabled={salvando}
                className="mt-1 rounded-xl"
              />
            </div>

            {erroSalvar && (
              <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30 px-3.5 py-2.5 text-sm text-red-800 dark:text-red-300">
                {erroSalvar}
              </div>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="rounded-xl" disabled={salvando}>Cancelar</Button>
            </DialogClose>
            <Button className="rounded-xl gap-2" onClick={confirmarRepresentante} disabled={!podeSalvarRepresentante() || salvando}>
              {salvando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

// ── Labels ─────────────────────────────────────────────────────────────────

const QUALIDADES_PREV = [
  { value: 'segurado_ativo',            label: 'Segurado ativo' },
  { value: 'aposentado',                label: 'Aposentado(a)' },
  { value: 'pensionista',               label: 'Pensionista' },
  { value: 'segurado_em_periodo_graca', label: 'Segurado em período de graça' },
] as const;

const RELACOES = [
  { value: 'conjuge',                    label: 'Cônjuge' },
  { value: 'companheiro',                label: 'Companheiro(a)' },
  { value: 'filho_menor',                label: 'Filho(a) menor de 21 anos' },
  { value: 'filho_invalido_maior',       label: 'Filho(a) inválido(a)' },
  { value: 'filho_universitario_ate_24', label: 'Filho(a) universitário(a) até 24 anos' },
  { value: 'pais',                       label: 'Pai / Mãe' },
  { value: 'irmao_menor',               label: 'Irmão/Irmã menor' },
  { value: 'irmao_invalido',            label: 'Irmão/Irmã inválido(a)' },
] as const;

const QUALIDADES_REP = [
  { value: 'tutor_nato',                label: 'Tutor(a) nato(a)' },
  { value: 'tutor_legal',               label: 'Tutor(a) legal' },
  { value: 'curador',                   label: 'Curador(a)' },
  { value: 'responsavel_termo_guarda',  label: 'Responsável por termo de guarda' },
  { value: 'administrador_provisorio',  label: 'Administrador(a) provisório(a)' },
  { value: 'procurador',                label: 'Procurador(a)' },
] as const;

type ValorQualPrev = typeof QUALIDADES_PREV[number]['value'];
type ValorRelacao  = typeof RELACOES[number]['value'];
type ValorQualRep  = typeof QUALIDADES_REP[number]['value'];

function labelQualPrev(v: string) { return QUALIDADES_PREV.find(q => q.value === v)?.label ?? v; }
function labelRelacao(v: string)  { return RELACOES.find(r => r.value === v)?.label ?? v; }
function labelQualRep(v: string)  { return QUALIDADES_REP.find(q => q.value === v)?.label ?? v; }

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR');
}

// ── Schema ─────────────────────────────────────────────────────────────────

const dependenteSchema = z.object({
  nome_completo:           z.string().min(2, 'Nome obrigatório'),
  cpf:                     z.string().optional(),
  data_nascimento:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data obrigatória'),
  relacao_com_instituidor: z.string().min(1, 'Selecione a relação'),
  e_titular_no_sistema:    z.boolean(),
});

const beneficiarioSchema = z.object({
  nome: z.string().min(2, 'Nome obrigatório'),
  cpf:  z.string().optional(),
});

const schema = z.object({
  instituidor: z.object({
    nome_completo:            z.string().min(2, 'Nome obrigatório').transform(v => v.toUpperCase()),
    data_obito:               z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data do óbito obrigatória'),
    qualidade_previdenciaria: z.string().min(1, 'Selecione a qualidade previdenciária'),
  }),
  dependentes: z.array(dependenteSchema).min(1, 'Informe pelo menos um dependente'),
  tem_representacao: z.boolean(),
  representacao_legal: z.object({
    representante_nome: z.string(),
    representante_cpf:  z.string(),
    qualidade:          z.string(),
    beneficiarios:      z.array(beneficiarioSchema),
  }).optional(),
}).superRefine((data, ctx) => {
  if (!data.tem_representacao) return;
  const rep = data.representacao_legal;
  if (!rep?.representante_nome || rep.representante_nome.length < 2) {
    ctx.addIssue({ code: 'custom', path: ['representacao_legal', 'representante_nome'], message: 'Nome obrigatório' });
  }
  if (!rep?.representante_cpf || rep.representante_cpf.replace(/\D/g, '').length < 11) {
    ctx.addIssue({ code: 'custom', path: ['representacao_legal', 'representante_cpf'], message: 'CPF inválido' });
  }
  if (!rep?.qualidade) {
    ctx.addIssue({ code: 'custom', path: ['representacao_legal', 'qualidade'], message: 'Selecione a qualidade' });
  }
  if (!rep?.beneficiarios?.length || !rep.beneficiarios[0]?.nome) {
    ctx.addIssue({ code: 'custom', path: ['representacao_legal', 'beneficiarios'], message: 'Informe pelo menos um beneficiário' });
  }
});

type FormValues = z.infer<typeof schema>;

// ── Tipos de props ─────────────────────────────────────────────────────────

type Dependente = { nome_completo: string; cpf: string; data_nascimento: string; relacao_com_instituidor: string; e_titular_no_sistema: boolean };
type BeneficiarioRep = { nome: string; cpf: string };

type Props = {
  processoId:      string;
  instituidor:     { nome_completo: string; data_obito: string; qualidade_previdenciaria: string } | null;
  dependentes:     Dependente[];
  representacaoLegal: { representante_nome: string; representante_cpf: string; qualidade: string; beneficiarios_representados: BeneficiarioRep[] } | null;
};

// ── Ícones inline ──────────────────────────────────────────────────────────

function IconUser() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

function IconUsers() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}

// ── Componente de seção do formulário ─────────────────────────────────────

function FormSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary">{icon}</span>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ── Read-mode: linha de dado ───────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 text-sm">
      <span className="text-muted-foreground text-xs pt-0.5 w-44 shrink-0">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

// ── Formulário interno (montado apenas quando open=true) ───────────────────

function PensaoMorteForm({
  processoId,
  defaultValues,
  onSuccess,
  onCancel,
}: {
  processoId: string;
  defaultValues: FormValues;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [submitError, setSubmitError] = useState('');

  const {
    register, handleSubmit, watch, setValue, control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const { fields: depFields, append: appendDep, remove: removeDep } = useFieldArray({ control, name: 'dependentes' });
  const { fields: benefFields, append: appendBenef, remove: removeBenef } = useFieldArray({ control, name: 'representacao_legal.beneficiarios' });

  const temRep             = watch('tem_representacao');
  const qualPrev           = watch('instituidor.qualidade_previdenciaria');
  const qualRep            = watch('representacao_legal.qualidade');
  const watchedDependentes = watch('dependentes');

  async function onSubmit(values: FormValues) {
    setSubmitError('');
    const payload = {
      instituidor: values.instituidor,
      dependentes: values.dependentes,
      representacao_legal: values.tem_representacao && values.representacao_legal
        ? {
            representante_nome:          values.representacao_legal.representante_nome,
            representante_cpf:           values.representacao_legal.representante_cpf,
            qualidade:                   values.representacao_legal.qualidade,
            beneficiarios_representados: values.representacao_legal.beneficiarios,
          }
        : null,
    };

    const res = await fetch(`/api/processos/${processoId}/pensao-morte`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    if (res.ok) {
      toast.success('Dados salvos com sucesso.');
      onSuccess();
    } else {
      const err = await res.json().catch(() => ({}));
      const msg = err?.error?.message ?? err?.error ?? 'Erro ao salvar. Tente novamente.';
      setSubmitError(msg);
      toast.error(msg);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto space-y-6 pr-1 py-2">

        {/* ── Seção 1: Instituidor ── */}
        <FormSection icon={<IconUser />} title="Instituidor (falecido)">
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Nome completo *</Label>
              <Input
                {...register('instituidor.nome_completo')}
                placeholder="Ex: FRANCISCO GENEROSO DA SILVA"
                className="mt-1 uppercase placeholder:normal-case"
              />
              {errors.instituidor?.nome_completo && (
                <p className="text-xs text-destructive mt-1">{errors.instituidor.nome_completo.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Data do óbito *</Label>
                <Input type="date" {...register('instituidor.data_obito')} className="mt-1" />
                {errors.instituidor?.data_obito && (
                  <p className="text-xs text-destructive mt-1">{errors.instituidor.data_obito.message}</p>
                )}
              </div>
              <div>
                <Label className="text-xs">Qualidade previdenciária *</Label>
                <Select
                  value={qualPrev}
                  onValueChange={(v) => setValue('instituidor.qualidade_previdenciaria', v, { shouldValidate: true })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {QUALIDADES_PREV.map(q => (
                      <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.instituidor?.qualidade_previdenciaria && (
                  <p className="text-xs text-destructive mt-1">{errors.instituidor.qualidade_previdenciaria.message}</p>
                )}
              </div>
            </div>
          </div>
        </FormSection>

        {/* ── Seção 2: Dependentes ── */}
        <div className="border-t border-border pt-5">
          <FormSection icon={<IconUsers />} title="Dependentes habilitados">
            <div className="space-y-3">
              {depFields.map((field, i) => (
                <div key={field.id} className="rounded-xl border border-border bg-secondary/20 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Dependente {i + 1}</span>
                    {depFields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDep(i)}
                        className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs">Nome completo *</Label>
                    <Input {...register(`dependentes.${i}.nome_completo`)} className="mt-1" />
                    {errors.dependentes?.[i]?.nome_completo && (
                      <p className="text-xs text-destructive mt-1">{errors.dependentes[i].nome_completo?.message}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">CPF</Label>
                      <Input {...register(`dependentes.${i}.cpf`)} placeholder="000.000.000-00" className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">Data de nascimento *</Label>
                      <Input type="date" {...register(`dependentes.${i}.data_nascimento`)} className="mt-1" />
                      {errors.dependentes?.[i]?.data_nascimento && (
                        <p className="text-xs text-destructive mt-1">{errors.dependentes[i].data_nascimento?.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
                    <div>
                      <Label className="text-xs">Relação com o instituidor *</Label>
                      <Select
                        value={watchedDependentes[i]?.relacao_com_instituidor ?? ''}
                        onValueChange={(v) => setValue(`dependentes.${i}.relacao_com_instituidor`, v as ValorRelacao, { shouldValidate: true })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Selecionar" />
                        </SelectTrigger>
                        <SelectContent>
                          {RELACOES.map(r => (
                            <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.dependentes?.[i]?.relacao_com_instituidor && (
                        <p className="text-xs text-destructive mt-1">{errors.dependentes[i].relacao_com_instituidor?.message}</p>
                      )}
                    </div>
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer pb-0.5">
                      <input
                        type="checkbox"
                        {...register(`dependentes.${i}.e_titular_no_sistema`)}
                        className="w-3.5 h-3.5 rounded"
                      />
                      Titular
                    </label>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl border-border text-xs h-8 w-full gap-1.5"
                onClick={() => appendDep({ nome_completo: '', cpf: '', data_nascimento: '', relacao_com_instituidor: '' as ValorRelacao, e_titular_no_sistema: false })}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Adicionar dependente
              </Button>
            </div>
          </FormSection>
        </div>

        {/* ── Seção 3: Representação legal ── */}
        <div className="border-t border-border pt-5">
          <FormSection icon={<IconShield />} title="Representação legal">
            <div className="space-y-3">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  {...register('tem_representacao')}
                  className="w-4 h-4 rounded accent-primary"
                />
                <span className="text-sm text-foreground group-hover:text-foreground/80 transition-colors">
                  Há representante legal (menores ou incapazes)
                </span>
              </label>

              {temRep && (
                <div className="rounded-xl border border-border bg-secondary/20 p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Nome do representante *</Label>
                      <Input {...register('representacao_legal.representante_nome')} className="mt-1" />
                      {errors.representacao_legal?.representante_nome && (
                        <p className="text-xs text-destructive mt-1">{errors.representacao_legal.representante_nome.message}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs">CPF *</Label>
                      <Input {...register('representacao_legal.representante_cpf')} placeholder="000.000.000-00" className="mt-1" />
                      {errors.representacao_legal?.representante_cpf && (
                        <p className="text-xs text-destructive mt-1">{errors.representacao_legal.representante_cpf.message}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Qualidade da representação *</Label>
                    <Select
                      value={qualRep ?? ''}
                      onValueChange={(v) => setValue('representacao_legal.qualidade', v as ValorQualRep, { shouldValidate: true })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {QUALIDADES_REP.map(q => (
                          <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.representacao_legal?.qualidade && (
                      <p className="text-xs text-destructive mt-1">{errors.representacao_legal.qualidade.message}</p>
                    )}
                  </div>

                  {/* Beneficiários representados */}
                  <div className="border-t border-border pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs font-semibold">Beneficiários representados</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 text-xs rounded-lg gap-1"
                        onClick={() => appendBenef({ nome: '', cpf: '' })}
                      >
                        + Adicionar
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {benefFields.map((field, i) => (
                        <div key={field.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                          <div>
                            {i === 0 && <Label className="text-xs mb-1 block">Nome *</Label>}
                            <Input {...register(`representacao_legal.beneficiarios.${i}.nome`)} placeholder="Nome completo" />
                          </div>
                          <div>
                            {i === 0 && <Label className="text-xs mb-1 block">CPF</Label>}
                            <Input {...register(`representacao_legal.beneficiarios.${i}.cpf`)} placeholder="000.000.000-00" />
                          </div>
                          {benefFields.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeBenef(i)}
                              className="text-muted-foreground hover:text-destructive transition-colors pb-0.5"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </FormSection>
        </div>
      </div>

      {/* Erro de submissão visível */}
      {submitError && (
        <p className="mt-2 text-sm text-destructive text-center">{submitError}</p>
      )}

      <DialogFooter className="pt-4 border-t border-border mt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-xl"
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting} className="rounded-xl">
          {isSubmitting ? 'Salvando...' : 'Salvar dados'}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ── Componente principal ───────────────────────────────────────────────────

export function PensaoMorteCard({ processoId, instituidor, dependentes, representacaoLegal }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function buildDefaultValues(): FormValues {
    return {
      instituidor: {
        nome_completo:            instituidor?.nome_completo ?? '',
        data_obito:               instituidor?.data_obito ?? '',
        qualidade_previdenciaria: (instituidor?.qualidade_previdenciaria as ValorQualPrev) ?? '',
      },
      dependentes: dependentes.length > 0
        ? dependentes.map(d => ({
            nome_completo:           d.nome_completo,
            cpf:                     d.cpf ?? '',
            data_nascimento:         d.data_nascimento,
            relacao_com_instituidor: d.relacao_com_instituidor as ValorRelacao,
            e_titular_no_sistema:    d.e_titular_no_sistema,
          }))
        : [{ nome_completo: '', cpf: '', data_nascimento: '', relacao_com_instituidor: '' as ValorRelacao, e_titular_no_sistema: false }],
      tem_representacao: !!representacaoLegal,
      representacao_legal: {
        representante_nome: representacaoLegal?.representante_nome ?? '',
        representante_cpf:  representacaoLegal?.representante_cpf ?? '',
        qualidade:          (representacaoLegal?.qualidade as ValorQualRep) ?? '',
        beneficiarios:      representacaoLegal?.beneficiarios_representados?.map(b => ({ nome: b.nome, cpf: b.cpf ?? '' })) ?? [{ nome: '', cpf: '' }],
      },
    };
  }

  const temDados = !!instituidor;

  return (
    <>
      {/* ── Card de leitura ─────────────────────────────────────────────── */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Dados da Pensão por Morte
          </h2>
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl border-border text-xs h-7 gap-1.5"
            onClick={() => setOpen(true)}
          >
            {temDados ? (
              <>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Editar
              </>
            ) : (
              <>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Preencher dados
              </>
            )}
          </Button>
        </div>

        {!temDados ? (
          <div className="flex items-center gap-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 p-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 dark:text-amber-400 shrink-0">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Dados do instituidor e dependentes ainda não preenchidos. Clique em{' '}
              <button onClick={() => setOpen(true)} className="font-medium underline underline-offset-2">Preencher dados</button>{' '}
              para continuar.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Instituidor */}
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                Instituidor
              </p>
              <div className="space-y-1.5">
                <InfoRow label="Nome" value={instituidor.nome_completo} />
                <InfoRow label="Data do óbito" value={fmtDate(instituidor.data_obito)} />
                <InfoRow label="Qualidade previdenciária" value={labelQualPrev(instituidor.qualidade_previdenciaria)} />
              </div>
            </div>

            {/* Dependentes */}
            {dependentes.length > 0 && (
              <div className="border-t border-border pt-4">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                  Dependentes habilitados ({dependentes.length})
                </p>
                <div className="space-y-2">
                  {dependentes.map((d, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl bg-secondary/40 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">{d.nome_completo}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {labelRelacao(d.relacao_com_instituidor)}
                          {d.e_titular_no_sistema && (
                            <span className="ml-1.5 inline-flex items-center rounded-full bg-primary/10 text-primary text-[10px] font-medium px-1.5 py-0.5">
                              Titular
                            </span>
                          )}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">{fmtDate(d.data_nascimento)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Representação legal */}
            {representacaoLegal && (
              <div className="border-t border-border pt-4">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                  Representação legal
                </p>
                <div className="space-y-1.5">
                  <InfoRow label="Representante" value={representacaoLegal.representante_nome} />
                  <InfoRow label="Qualidade" value={labelQualRep(representacaoLegal.qualidade)} />
                  <InfoRow
                    label="Beneficiários representados"
                    value={representacaoLegal.beneficiarios_representados.map(b => b.nome).join(', ')}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Dialog: remonta o formulário a cada abertura ─────────────────── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl flex flex-col max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Dados da Pensão por Morte</DialogTitle>
          </DialogHeader>

          {open && (
            <PensaoMorteForm
              processoId={processoId}
              defaultValues={buildDefaultValues()}
              onSuccess={() => { setOpen(false); router.refresh(); }}
              onCancel={() => setOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

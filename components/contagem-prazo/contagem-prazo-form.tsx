'use client';

import { useState, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ResultadoCalculo } from '@/lib/motor-previdenciario';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const etapa1Schema = z.object({
  nome: z.string().min(3, 'Nome obrigatório'),
  cpf: z.string().min(11, 'CPF obrigatório'),
  dataNascimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  sexo: z.enum(['M', 'F'], { message: 'Selecione o sexo' }),
  der: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'DER inválida'),
  filiadoAntesDaReforma: z.boolean(),
});

const etapa2Schema = z.object({
  periodos: z.array(
    z.object({
      inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
      fim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
      origem: z.enum(['RGPS', 'RPPS', 'facultativo']),
    })
  ).min(1, 'Informe ao menos um período'),
});

const etapa3Schema = z.object({
  salarios: z.array(
    z.object({
      competencia: z.string().regex(/^\d{2}\/\d{4}$/, 'Formato: MM/AAAA'),
      valor: z.string().min(1, 'Valor obrigatório'),
    })
  ),
  pularSalarios: z.boolean().optional(),
});

type Etapa1 = z.infer<typeof etapa1Schema>;
type Etapa2 = z.infer<typeof etapa2Schema>;
type Etapa3 = z.infer<typeof etapa3Schema>;

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'contagem-prazo-form';

function salvarStorage(dados: Partial<{ etapa1: Etapa1; etapa2: Etapa2; etapa3: Etapa3 }>) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
  } catch {}
}

function carregarStorage(): Partial<{ etapa1: Etapa1; etapa2: Etapa2; etapa3: Etapa3 }> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// ─── Helpers visuais ──────────────────────────────────────────────────────────

function formatarData(iso: string) {
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

function formatarMoeda(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function BadgeData({ data }: { data: string | null }) {
  if (!data) return <span className="text-muted-foreground text-xs">—</span>;
  const ano = parseInt(data.split('-')[0]);
  const passado = ano <= new Date().getFullYear();
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${passado ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-primary/10 text-primary'}`}>
      {passado ? 'Já atingido' : formatarData(data)}
    </span>
  );
}

function BadgeElegivel({ ok }: { ok: boolean }) {
  return ok
    ? <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5 dark:bg-emerald-900/20 dark:text-emerald-400">Elegível</span>
    : <span className="text-xs bg-muted text-muted-foreground border border-border rounded-full px-2 py-0.5">Não elegível</span>;
}

// ─── Etapa 1 ──────────────────────────────────────────────────────────────────

function Etapa1({ onNext }: { onNext: (d: Etapa1) => void }) {
  const saved = carregarStorage().etapa1;
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<Etapa1>({
    resolver: zodResolver(etapa1Schema),
    defaultValues: saved ?? { filiadoAntesDaReforma: true },
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="nome">Nome completo do segurado</Label>
          <Input id="nome" {...register('nome')} placeholder="Nome completo" />
          {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cpf">CPF</Label>
          <Input id="cpf" {...register('cpf')} placeholder="000.000.000-00" />
          {errors.cpf && <p className="text-xs text-destructive">{errors.cpf.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Sexo</Label>
          <Select onValueChange={(v) => setValue('sexo', v as 'M' | 'F')} defaultValue={saved?.sexo}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="F">Feminino</SelectItem>
              <SelectItem value="M">Masculino</SelectItem>
            </SelectContent>
          </Select>
          {errors.sexo && <p className="text-xs text-destructive">{errors.sexo.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="dataNascimento">Data de nascimento</Label>
          <Input id="dataNascimento" type="date" {...register('dataNascimento')} />
          {errors.dataNascimento && <p className="text-xs text-destructive">{errors.dataNascimento.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="der">
            DER — Data de Entrada do Requerimento
            <span className="ml-1 text-xs text-muted-foreground">(data do pedido no INSS)</span>
          </Label>
          <Input id="der" type="date" {...register('der')} />
          {errors.der && <p className="text-xs text-destructive">{errors.der.message}</p>}
        </div>
      </div>

      <div className="rounded-xl bg-muted/50 border border-border px-4 py-3 flex items-start gap-3">
        <input
          id="filiado"
          type="checkbox"
          className="mt-0.5 h-4 w-4 rounded border-input accent-primary"
          {...register('filiadoAntesDaReforma')}
        />
        <div>
          <Label htmlFor="filiado" className="cursor-pointer font-medium">
            Segurado era filiado ao RGPS antes de 13/11/2019
          </Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Necessário para acessar as regras de transição (Arts. 15, 16, 17 e 20 da EC 103/2019).
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" className="rounded-xl">
          Próximo — Períodos Contributivos
          <svg className="ml-1.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Button>
      </div>
    </form>
  );
}

// ─── Etapa 2 ──────────────────────────────────────────────────────────────────

function Etapa2({ onNext, onBack }: { onNext: (d: Etapa2) => void; onBack: () => void }) {
  const saved = carregarStorage().etapa2;
  const { register, handleSubmit, control, formState: { errors } } = useForm<Etapa2>({
    resolver: zodResolver(etapa2Schema),
    defaultValues: saved ?? { periodos: [{ inicio: '', fim: '', origem: 'RGPS' }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'periodos' });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300">
        <strong>Atenção:</strong> Informe os períodos exatamente como constam no CNIS. Períodos RPPS serão incluídos no cálculo do planejamento, mas exigem certidão de tempo de serviço para averbação formal no INSS.
      </div>

      <div className="space-y-3">
        {fields.map((field, i) => (
          <div key={field.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Período {i + 1}
              </span>
              {fields.length > 1 && (
                <button type="button" onClick={() => remove(i)} className="text-destructive text-xs hover:underline">
                  Remover
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Início</Label>
                <Input type="date" {...register(`periodos.${i}.inicio`)} />
                {errors.periodos?.[i]?.inicio && (
                  <p className="text-xs text-destructive">{errors.periodos[i]?.inicio?.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Fim</Label>
                <Input type="date" {...register(`periodos.${i}.fim`)} />
                {errors.periodos?.[i]?.fim && (
                  <p className="text-xs text-destructive">{errors.periodos[i]?.fim?.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Regime</Label>
                <select
                  {...register(`periodos.${i}.origem`)}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <option value="RGPS">RGPS (CLT / Autônomo)</option>
                  <option value="RPPS">RPPS (Servidor Público)</option>
                  <option value="facultativo">Facultativo</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      {errors.periodos && typeof errors.periodos === 'object' && 'message' in errors.periodos && (
        <p className="text-xs text-destructive">{(errors.periodos as { message?: string }).message}</p>
      )}

      <button
        type="button"
        onClick={() => append({ inicio: '', fim: '', origem: 'RGPS' })}
        className="flex items-center gap-1.5 text-sm text-primary hover:underline"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
        </svg>
        Adicionar período
      </button>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack} className="rounded-xl">Voltar</Button>
        <Button type="submit" className="rounded-xl">
          Próximo — Salários
          <svg className="ml-1.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Button>
      </div>
    </form>
  );
}

// ─── Etapa 3 ──────────────────────────────────────────────────────────────────

function Etapa3({ onNext, onBack }: { onNext: (d: Etapa3) => void; onBack: () => void }) {
  const saved = carregarStorage().etapa3;
  const [pular, setPular] = useState(saved?.pularSalarios ?? false);
  const { register, handleSubmit, control, formState: { errors } } = useForm<Etapa3>({
    resolver: zodResolver(etapa3Schema),
    defaultValues: saved ?? { salarios: [], pularSalarios: false },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'salarios' });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      <div className="rounded-xl bg-muted/50 border border-border px-4 py-3 text-sm text-muted-foreground">
        Informe os salários de contribuição para estimar o valor do benefício. Use os valores brutos informados no holerite / carnê INSS — não aplique o teto manualmente.
      </div>

      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/50 border border-border">
        <input
          id="pular"
          type="checkbox"
          className="h-4 w-4 rounded border-input accent-primary"
          {...register('pularSalarios')}
          onChange={(e) => setPular(e.target.checked)}
        />
        <Label htmlFor="pular" className="cursor-pointer">
          Pular — não calcular benefício agora
        </Label>
      </div>

      {!pular && (
        <div className="space-y-3">
          {fields.map((field, i) => (
            <div key={field.id} className="flex items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <Label>Competência (MM/AAAA)</Label>
                <Input {...register(`salarios.${i}.competencia`)} placeholder="01/2023" />
                {errors.salarios?.[i]?.competencia && (
                  <p className="text-xs text-destructive">{errors.salarios[i]?.competencia?.message}</p>
                )}
              </div>
              <div className="flex-1 space-y-1.5">
                <Label>Valor (R$)</Label>
                <Input type="number" step="0.01" min="0" {...register(`salarios.${i}.valor`)} placeholder="3.000,00" />
                {errors.salarios?.[i]?.valor && (
                  <p className="text-xs text-destructive">{errors.salarios[i]?.valor?.message}</p>
                )}
              </div>
              <button type="button" onClick={() => remove(i)} className="mb-0.5 p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => append({ competencia: '', valor: '' })}
            className="flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
            </svg>
            Adicionar salário
          </button>
        </div>
      )}

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack} className="rounded-xl">Voltar</Button>
        <Button type="submit" className="rounded-xl">
          Calcular
          <svg className="ml-1.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Button>
      </div>
    </form>
  );
}

// ─── Etapa 4 — Resultado ──────────────────────────────────────────────────────

function CardRegra({
  titulo,
  artigo,
  resultado,
  melhor,
  extras,
}: {
  titulo: string;
  artigo: string;
  resultado: { elegivel: boolean; dataCumprimento: string | null; observacao: string };
  melhor?: boolean;
  extras?: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl p-5 border transition-colors ${
      melhor
        ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-700 ring-1 ring-emerald-300 dark:ring-emerald-700'
        : 'bg-card border-border'
    }`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">{artigo}</p>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground leading-tight">{titulo}</h3>
            {melhor && (
              <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-emerald-600 text-white">
                Melhor opção
              </span>
            )}
          </div>
        </div>
        <BadgeElegivel ok={resultado.elegivel} />
      </div>
      {resultado.elegivel && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-muted-foreground">Data prevista:</span>
          <BadgeData data={resultado.dataCumprimento} />
        </div>
      )}
      {extras}
      <p className="text-xs text-muted-foreground leading-relaxed mt-2">{resultado.observacao}</p>
    </div>
  );
}

function Etapa4({
  resultado,
  etapa1,
  onBack,
  onNovo,
}: {
  resultado: ResultadoCalculo;
  etapa1: Etapa1;
  onBack: () => void;
  onNovo: () => void;
}) {
  const [gerando, setGerando] = useState<'planejamento' | 'email' | null>(null);

  async function gerarDocx(tipo: 'planejamento' | 'email') {
    setGerando(tipo);
    try {
      const res = await fetch('/api/contagem-prazo/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo,
          entrada: {
            nome: etapa1.nome,
            cpf: etapa1.cpf,
            dataNascimento: etapa1.dataNascimento,
            sexo: etapa1.sexo,
            der: etapa1.der,
          },
          resultado,
        }),
      });

      if (!res.ok) throw new Error('Falha na geração');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = tipo === 'planejamento'
        ? `planejamento_${etapa1.nome.replace(/\s+/g, '_')}.docx`
        : `email_${etapa1.nome.replace(/\s+/g, '_')}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Erro ao gerar documento. Tente novamente.');
    } finally {
      setGerando(null);
    }
  }

  const m = resultado.melhorOpcao;

  return (
    <div className="space-y-6">
      {/* Resumo do segurado */}
      <div className="bg-muted/40 rounded-2xl border border-border px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Segurado</p>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <span className="font-semibold text-foreground">{etapa1.nome}</span>
          <span className="text-muted-foreground">{etapa1.sexo === 'F' ? 'Feminino' : 'Masculino'}</span>
          <span className="text-muted-foreground">Nascimento: {formatarData(etapa1.dataNascimento)}</span>
          <span className="text-muted-foreground">DER: {formatarData(etapa1.der)}</span>
        </div>
      </div>

      {/* Tempo contributivo + destaque melhor opção */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 text-center flex flex-col justify-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-1">Tempo contributivo total</p>
          <p className="text-2xl font-bold text-foreground">{resultado.totalContributivoFormatado}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Projeção assume contribuição contínua a partir da DER.</p>
        </div>
        {resultado.dataMaisProxima && (
          <div className="bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-700 rounded-2xl p-5 text-center flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-1">Aposentadoria mais próxima</p>
            <p className="text-2xl font-bold text-foreground">{formatarData(resultado.dataMaisProxima)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Pela melhor regra disponível.</p>
          </div>
        )}
      </div>

      {/* Cards das regras */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CardRegra
          artigo="EC 103/2019 — Art. 15"
          titulo="Sistema de Pontos"
          resultado={resultado.art15Pontos}
          melhor={m === 'art15'}
          extras={resultado.art15Pontos.elegivel && (
            <div className="flex gap-4 text-xs text-muted-foreground mb-1">
              <span>Pontos na DER: <strong className="text-foreground">{resultado.art15Pontos.pontosNaDer ?? '—'}</strong></span>
              <span>Necessários: <strong className="text-foreground">{resultado.art15Pontos.pontosNecessariosNaDer ?? '—'}</strong></span>
            </div>
          )}
        />

        <CardRegra
          artigo="EC 103/2019 — Art. 16"
          titulo="Idade Progressiva"
          resultado={resultado.art16IdadeProgressiva}
          melhor={m === 'art16'}
          extras={resultado.art16IdadeProgressiva.idadeNecessaria && (
            <p className="text-xs text-muted-foreground mb-1">
              Idade mínima: <strong className="text-foreground">{resultado.art16IdadeProgressiva.idadeNecessaria}</strong>
            </p>
          )}
        />

        <CardRegra
          artigo="EC 103/2019 — Art. 17"
          titulo="Pedágio 50%"
          resultado={resultado.art17Pedagio50}
          melhor={m === 'art17'}
        />

        <CardRegra
          artigo="EC 103/2019 — Art. 18"
          titulo="Aposentadoria por Idade"
          resultado={resultado.art18AposIdade}
          melhor={m === 'art18'}
        />

        <CardRegra
          artigo="EC 103/2019 — Art. 20"
          titulo="Pedágio 100%"
          resultado={resultado.art20Pedagio100}
          melhor={m === 'art20'}
        />

        {/* Benefício */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Benefício estimado</p>
          {resultado.salarioBeneficio > 0 ? (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Salário de benefício</span>
                <span className="font-mono">{formatarMoeda(resultado.salarioBeneficio)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Coeficiente na aposentadoria</span>
                <span className="font-mono">{(resultado.coeficienteNaAposentadoria * 100).toFixed(2)}%</span>
              </div>
              {resultado.coeficienteNaAposentadoria !== resultado.coeficienteEC103 && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Coeficiente atual (DER)</span>
                  <span className="font-mono text-muted-foreground">{(resultado.coeficienteEC103 * 100).toFixed(2)}%</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Teto INSS</span>
                <span className="font-mono">{formatarMoeda(resultado.tetoINSS)}</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex justify-between">
                <span className="font-semibold text-foreground">Benefício mensal</span>
                <span className="font-bold font-mono text-primary text-lg">{formatarMoeda(resultado.beneficioMensal)}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Estimativa projetada para a data da melhor aposentadoria. Valores sujeitos à portaria INSS vigente.
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Salários não informados — benefício não calculado.</p>
          )}
        </div>
      </div>

      {/* Ações */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button
          variant="outline"
          className="rounded-xl flex-1"
          disabled={!!gerando}
          onClick={() => gerarDocx('email')}
        >
          {gerando === 'email' ? 'Gerando…' : 'Baixar e-mail resumido'}
        </Button>
        <Button
          className="rounded-xl flex-1"
          disabled={!!gerando}
          onClick={() => gerarDocx('planejamento')}
        >
          {gerando === 'planejamento' ? 'Gerando…' : 'Baixar planejamento completo'}
        </Button>
      </div>

      <div className="flex justify-between pt-2">
        <Button type="button" variant="outline" onClick={onBack} className="rounded-xl text-sm">
          Voltar
        </Button>
        <Button type="button" variant="outline" onClick={onNovo} className="rounded-xl text-sm">
          Novo cálculo
        </Button>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

const ETAPAS = [
  { label: 'Segurado', desc: 'Dados pessoais' },
  { label: 'CNIS', desc: 'Períodos contributivos' },
  { label: 'Salários', desc: 'Remunerações' },
  { label: 'Resultado', desc: 'Planejamento' },
];

export function ContagemPrazoForm() {
  const [etapa, setEtapa] = useState(0);
  const [etapa1, setEtapa1] = useState<Etapa1 | null>(null);
  const [etapa2, setEtapa2] = useState<Etapa2 | null>(null);
  const [resultado, setResultado] = useState<ResultadoCalculo | null>(null);
  const [calculando, setCalculando] = useState(false);
  const [erroCalculo, setErroCalculo] = useState('');

  const handleEtapa1 = (d: Etapa1) => {
    setEtapa1(d);
    salvarStorage({ ...carregarStorage(), etapa1: d });
    setEtapa(1);
  };

  const handleEtapa2 = (d: Etapa2) => {
    setEtapa2(d);
    salvarStorage({ ...carregarStorage(), etapa2: d });
    setEtapa(2);
  };

  const handleEtapa3 = useCallback(async (d: Etapa3) => {
    salvarStorage({ ...carregarStorage(), etapa3: d });
    setCalculando(true);
    setErroCalculo('');

    const salarios = d.pularSalarios
      ? []
      : d.salarios.map((s) => ({ competencia: s.competencia, valor: parseFloat(s.valor) }));

    try {
      const res = await fetch('/api/contagem-prazo/calcular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataNascimento: etapa1!.dataNascimento,
          sexo: etapa1!.sexo,
          der: etapa1!.der,
          filiadoAntesDaReforma: etapa1!.filiadoAntesDaReforma,
          periodos: etapa2!.periodos,
          salarios,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Erro no cálculo');
      }

      const r: ResultadoCalculo = await res.json();
      setResultado(r);
      setEtapa(3);
    } catch (e) {
      setErroCalculo(e instanceof Error ? e.message : 'Erro inesperado');
    } finally {
      setCalculando(false);
    }
  }, [etapa1, etapa2]);

  const novoCalculo = () => {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
    setEtapa(0);
    setEtapa1(null);
    setEtapa2(null);
    setResultado(null);
  };

  return (
    <div>
      {/* Progress steps */}
      <div className="flex items-center gap-0 mb-8">
        {ETAPAS.map((e, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                i < etapa ? 'bg-primary text-primary-foreground' :
                i === etapa ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' :
                'bg-muted text-muted-foreground'
              }`}>
                {i < etapa ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : i + 1}
              </div>
              <div className="text-center mt-1.5 hidden sm:block">
                <p className={`text-xs font-semibold ${i === etapa ? 'text-foreground' : 'text-muted-foreground'}`}>{e.label}</p>
                <p className="text-[10px] text-muted-foreground">{e.desc}</p>
              </div>
            </div>
            {i < ETAPAS.length - 1 && (
              <div className={`h-0.5 flex-1 mx-2 transition-colors ${i < etapa ? 'bg-primary' : 'bg-border'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Conteúdo da etapa */}
      <div className="bg-card rounded-2xl border border-border p-6 sm:p-8">
        {etapa === 0 && <Etapa1 onNext={handleEtapa1} />}
        {etapa === 1 && <Etapa2 onNext={handleEtapa2} onBack={() => setEtapa(0)} />}
        {etapa === 2 && (
          <>
            <Etapa3 onNext={handleEtapa3} onBack={() => setEtapa(1)} />
            {calculando && (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Calculando…
              </div>
            )}
            {erroCalculo && (
              <div className="mt-4 rounded-lg bg-destructive/10 border border-destructive/20 px-3.5 py-2.5">
                <p className="text-sm text-destructive">{erroCalculo}</p>
              </div>
            )}
          </>
        )}
        {etapa === 3 && resultado && etapa1 && (
          <Etapa4
            resultado={resultado}
            etapa1={etapa1}
            onBack={() => setEtapa(2)}
            onNovo={novoCalculo}
          />
        )}
      </div>
    </div>
  );
}

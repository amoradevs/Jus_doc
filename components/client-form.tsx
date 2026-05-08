'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clientSchema, type ClientInput } from '@/lib/validators/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { maskCPF, unmaskCPF } from '@/lib/validators/cpf';
import { useCepLookup } from '@/hooks/use-cep-lookup';
import Link from 'next/link';
import { useState } from 'react';

type Props = {
  mode: 'create' | 'edit';
  clientId?: string;
  defaultValues?: Partial<ClientInput>;
};

type CpfCheck = { exists: true; id: string; nome: string } | { exists: false };

export function ClientForm({ mode, clientId, defaultValues }: Props) {
  const router = useRouter();
  const [cpfCheck, setCpfCheck] = useState<CpfCheck | null>(null);
  const [cpfChecking, setCpfChecking] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<ClientInput>({
    resolver: zodResolver(clientSchema),
    defaultValues: defaultValues ?? { nacionalidade: 'brasileiro' },
  });

  async function checkCpf(cpfMasked: string) {
    if (mode !== 'create') return;
    const raw = unmaskCPF(cpfMasked);
    if (raw.length !== 11) { setCpfCheck(null); return; }
    setCpfChecking(true);
    try {
      const res = await fetch(`/api/clientes/check-cpf?cpf=${raw}`);
      const data: CpfCheck = await res.json();
      setCpfCheck(data);
    } catch {
      setCpfCheck(null);
    } finally {
      setCpfChecking(false);
    }
  }

  const { lookupCep, loading: cepLoading } = useCepLookup((data) => {
    setValue('endereco_logradouro', data.logradouro);
    setValue('endereco_bairro', data.bairro);
    setValue('endereco_cidade', data.localidade);
    setValue('endereco_uf', data.uf);
  });

  const onSubmit = async (data: ClientInput) => {
    const url = mode === 'create' ? '/api/clientes' : `/api/clientes/${clientId}`;
    const method = mode === 'create' ? 'POST' : 'PUT';
    const payload = {
      ...data,
      cpf: unmaskCPF(data.cpf),
    };

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const json = await res.json();
      toast.success(mode === 'create' ? 'Cliente cadastrado com sucesso.' : 'Dados atualizados com sucesso.');
      if (mode === 'create') {
        router.push(`/clientes/${json.id}/processos/novo`);
      } else {
        router.push(`/clientes/${clientId}`);
      }
    } else {
      const err = await res.json();
      if (err?.error?.code === 'CPF_ALREADY_EXISTS') {
        // Banner inline já aparece via onChange — não duplicar com toast
        setCpfCheck({ exists: true, id: err.error.existing_client_id, nome: err.error.nome ?? 'Cliente existente' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        toast.error(err?.error?.message ?? 'Erro ao salvar cliente.');
      }
    }
  };

  const field = (id: keyof ClientInput, label: string, type = 'text', extra?: object) => (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} {...register(id)} {...extra} />
      {errors[id] && <p className="text-xs text-destructive">{errors[id]?.message}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

      <section>
        <h2 className="font-semibold text-foreground mb-4">Identificação</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">{field('nome_completo', 'Nome completo')}</div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="cpf">CPF</Label>
            <div className="relative">
              <Input
                id="cpf"
                maxLength={14}
                placeholder="000.000.000-00"
                {...register('cpf')}
                onChange={(e) => {
                  const masked = maskCPF(e.target.value);
                  setValue('cpf', masked);
                  // Limpa resultado anterior ao editar
                  if (cpfCheck) setCpfCheck(null);
                  // Dispara check assim que os 11 dígitos estão completos (14 chars mascarados)
                  if (masked.length === 14) checkCpf(masked);
                }}
                className={cpfCheck?.exists ? 'border-amber-400 focus-visible:ring-amber-400/30' : ''}
              />
              {cpfChecking && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-3.5 h-3.5 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
                </div>
              )}
            </div>
            {errors.cpf && <p className="text-xs text-destructive">{errors.cpf.message}</p>}

            {/* Banner de duplicata */}
            {cpfCheck?.exists && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 mt-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    CPF já cadastrado
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                    <strong>{cpfCheck.nome}</strong> já tem cadastro neste sistema.{' '}
                    Para adicionar um novo processo, acesse o perfil dela.
                  </p>
                  <Link
                    href={`/clientes/${cpfCheck.id}`}
                    className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:underline"
                  >
                    Abrir perfil de {cpfCheck.nome.split(' ')[0]}
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </Link>
                </div>
                <button
                  type="button"
                  onClick={() => setCpfCheck(null)}
                  className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
                  aria-label="Fechar aviso"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            )}
          </div>
          {field('rg', 'RG')}
          {field('rg_orgao_emissor', 'Órgão emissor')}
          {field('data_nascimento', 'Data de nascimento', 'date')}
          <div className="space-y-1">
            <Label htmlFor="genero">Gênero</Label>
            <Select onValueChange={(v) => setValue('genero', v as 'M' | 'F')} defaultValue={defaultValues?.genero}>
              <SelectTrigger id="genero"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="F">Feminino</SelectItem>
                <SelectItem value="M">Masculino</SelectItem>
              </SelectContent>
            </Select>
            {errors.genero && <p className="text-xs text-destructive">{errors.genero.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="estado_civil">Estado civil</Label>
            <Select onValueChange={(v) => setValue('estado_civil', v as ClientInput['estado_civil'])} defaultValue={defaultValues?.estado_civil}>
              <SelectTrigger id="estado_civil"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                <SelectItem value="casado">Casado(a)</SelectItem>
                <SelectItem value="separado">Separado(a)</SelectItem>
                <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                <SelectItem value="uniao_estavel">União estável</SelectItem>
              </SelectContent>
            </Select>
            {errors.estado_civil && <p className="text-xs text-destructive">{errors.estado_civil.message}</p>}
          </div>
          {field('nacionalidade', 'Nacionalidade')}
          {field('nome_mae', 'Nome da mãe')}
          {field('nome_pai', 'Nome do pai (opcional)')}
          {field('telefone', 'WhatsApp / telefone', 'tel')}
          {field('senha_cadastro', 'Senha do cadastro (Meu INSS / gov.br)')}
        </div>
      </section>

      <section>
        <h2 className="font-semibold text-foreground mb-4">Endereço de residência</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label htmlFor="endereco_cep">CEP</Label>
            <Input
              id="endereco_cep"
              maxLength={9}
              placeholder="00000-000"
              {...register('endereco_cep')}
              onBlur={(e) => lookupCep(e.target.value)}
            />
            {cepLoading && <p className="text-xs text-muted-foreground">Buscando CEP…</p>}
            {errors.endereco_cep && <p className="text-xs text-destructive">{errors.endereco_cep.message}</p>}
          </div>
          <div className="sm:col-span-2">{field('endereco_logradouro', 'Logradouro')}</div>
          <div>{field('endereco_numero', 'Número')}</div>
          <div>{field('endereco_complemento', 'Complemento')}</div>
          <div>{field('endereco_bairro', 'Bairro')}</div>
          <div>{field('endereco_cidade', 'Cidade')}</div>
          <div>{field('endereco_uf', 'UF')}</div>
        </div>
      </section>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting || cpfCheck?.exists === true}>
          {isSubmitting ? 'Salvando…' : mode === 'create' ? 'Cadastrar cliente' : 'Salvar alterações'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
      </div>
    </form>
  );
}

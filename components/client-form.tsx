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

type Props = {
  mode: 'create' | 'edit';
  clientId?: string;
  defaultValues?: Partial<ClientInput>;
};

export function ClientForm({ mode, clientId, defaultValues }: Props) {
  const router = useRouter();
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<ClientInput>({
    resolver: zodResolver(clientSchema),
    defaultValues: defaultValues ?? { nacionalidade: 'brasileiro' },
  });

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
        toast.error(
          <span>
            Este CPF já está cadastrado.{' '}
            <Link href={`/clientes/${err.error.existing_client_id}`} className="underline">
              Ver cliente
            </Link>
          </span>
        );
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
          <div className="space-y-1">
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              maxLength={14}
              placeholder="000.000.000-00"
              {...register('cpf')}
              onChange={(e) => setValue('cpf', maskCPF(e.target.value))}
            />
            {errors.cpf && <p className="text-xs text-destructive">{errors.cpf.message}</p>}
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
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando…' : mode === 'create' ? 'Cadastrar cliente' : 'Salvar alterações'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
      </div>
    </form>
  );
}

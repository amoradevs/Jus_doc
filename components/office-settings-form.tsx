'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { officeSettingsSchema, type OfficeSettingsInput } from '@/lib/validators/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useCepLookup } from '@/hooks/use-cep-lookup';

type Props = { defaultValues?: Partial<OfficeSettingsInput> };

export function OfficeSettingsForm({ defaultValues }: Props) {
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<OfficeSettingsInput>({
    resolver: zodResolver(officeSettingsSchema),
    defaultValues: defaultValues ?? {},
  });

  const { lookupCep, loading: cepLoading } = useCepLookup((data) => {
    setValue('endereco_logradouro', data.logradouro);
    setValue('endereco_bairro', data.bairro);
    setValue('endereco_cidade', data.localidade);
    setValue('endereco_uf', data.uf);
  });

  const onSubmit = async (data: OfficeSettingsInput) => {
    const res = await fetch('/api/configuracoes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      toast.success('Configurações salvas com sucesso.');
    } else {
      const err = await res.json();
      toast.error(err?.error?.message ?? 'Erro ao salvar configurações.');
    }
  };

  const field = (id: keyof OfficeSettingsInput, label: string, type = 'text') => (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} {...register(id)} />
      {errors[id] && <p className="text-xs text-destructive">{errors[id]?.message}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <section>
        <h2 className="font-semibold text-slate-800 mb-4">Advogada principal</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field('advogada_principal_nome', 'Nome completo')}
          {field('advogada_principal_nome_curto', 'Nome curto (assinaturas)')}
          {field('advogada_principal_oab', 'OAB')}
          {field('advogada_principal_email', 'E-mail', 'email')}
        </div>
      </section>

      <section>
        <h2 className="font-semibold text-slate-800 mb-4">Advogada parceira</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field('advogada_parceira_nome', 'Nome completo')}
          {field('advogada_parceira_nome_curto', 'Nome curto (assinaturas)')}
          {field('advogada_parceira_oab', 'OAB')}
          {field('advogada_parceira_email', 'E-mail', 'email')}
        </div>
      </section>

      <section>
        <h2 className="font-semibold text-slate-800 mb-4">Endereço do escritório</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label htmlFor="endereco_cep">CEP</Label>
            <Input
              id="endereco_cep"
              maxLength={9}
              {...register('endereco_cep')}
              onBlur={(e) => lookupCep(e.target.value)}
              placeholder="00000-000"
            />
            {cepLoading && <p className="text-xs text-muted-foreground">Buscando CEP…</p>}
            {errors.endereco_cep && <p className="text-xs text-destructive">{errors.endereco_cep.message}</p>}
          </div>
          <div className="sm:col-span-2">{field('endereco_logradouro', 'Logradouro')}</div>
          <div>{field('endereco_numero', 'Número')}</div>
          <div>{field('endereco_complemento', 'Complemento')}</div>
          <div>{field('endereco_bairro', 'Bairro')}</div>
          <div>{field('endereco_cidade', 'Cidade')}</div>
          <div className="sm:col-span-1">{field('endereco_uf', 'UF')}</div>
        </div>
      </section>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Salvando…' : 'Salvar configurações'}
      </Button>
    </form>
  );
}

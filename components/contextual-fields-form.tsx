'use client';

import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ContextualGroup } from '@/lib/document-generation/contextual-fields-resolver';

type Props = { clientId: string; missingGroups: ContextualGroup[]; codigos: string };

const LABELS: Record<ContextualGroup, string> = {
  representante_legal: 'Representante legal',
  conjuge: 'Cônjuge / Ex-cônjuge',
  filho_dependente: 'Filho dependente',
  empresa_mei: 'Empresa MEI',
  imovel: 'Imóvel',
  testemunhas: 'Testemunhas',
};

export function ContextualFieldsForm({ clientId, missingGroups, codigos }: Props) {
  const router = useRouter();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();

  const onSubmit = async (data: Record<string, unknown>) => {
    const payload: Record<string, unknown> = {};
    for (const group of missingGroups) {
      payload[group] = data[group] ?? null;
    }
    const res = await fetch(`/api/clientes/${clientId}/contextual-data`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      router.push(`/clientes/${clientId}/gerar/resultado?codigos=${codigos}`);
    } else {
      toast.error('Erro ao salvar os dados. Tente novamente.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {missingGroups.map((group) => (
        <section key={group} className="bg-white border rounded-lg p-4">
          <h2 className="font-semibold text-slate-700 mb-4">{LABELS[group]}</h2>
          <GroupFields group={group} register={register} />
        </section>
      ))}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Salvando…' : 'Salvar e gerar documentos'}
      </Button>
    </form>
  );
}

function GroupFields({ group, register }: { group: ContextualGroup; register: ReturnType<typeof useForm>['register'] }) {
  const f = (name: string, label: string, type = 'text') => (
    <div className="space-y-1">
      <Label htmlFor={`${group}.${name}`}>{label}</Label>
      <Input id={`${group}.${name}`} type={type} {...register(`${group}.${name}`)} />
    </div>
  );

  if (group === 'representante_legal') return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {f('nome', 'Nome completo')}
      {f('cpf', 'CPF')}
      {f('rg', 'RG')}
      {f('parentesco', 'Parentesco')}
      {f('nome_mae', 'Nome da mãe do representante')}
    </div>
  );

  if (group === 'conjuge') return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {f('data_separacao', 'Data da separação', 'date')}
    </div>
  );

  if (group === 'filho_dependente') return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {f('nome', 'Nome do filho')}
      {f('cpf', 'CPF (se tiver)')}
      {f('rg', 'RG (se tiver)')}
      {f('data_nascimento', 'Data de nascimento', 'date')}
    </div>
  );

  if (group === 'empresa_mei') return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {f('razao_social', 'Razão social')}
      {f('cnpj', 'CNPJ')}
      {f('cnae', 'CNAE')}
      {f('ramo', 'Ramo de atividade')}
      {f('data_abertura', 'Data de abertura', 'date')}
      {f('data_inatividade', 'Data de inatividade', 'date')}
      <div className="sm:col-span-2">{f('descricao_inicio_inatividade', 'Descrição do início da inatividade')}</div>
    </div>
  );

  if (group === 'imovel') return (
    <div className="grid grid-cols-1 gap-4">
      {f('proprietario_nome', 'Nome do proprietário do imóvel')}
    </div>
  );

  if (group === 'testemunhas') return (
    <div className="space-y-4">
      {[0, 1].map((i) => (
        <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 text-xs font-semibold text-slate-500 uppercase">Testemunha {i + 1}</div>
          {f(`testemunhas[${i}].nome`, 'Nome')}
          {f(`testemunhas[${i}].cpf`, 'CPF')}
          {f(`testemunhas[${i}].rg`, 'RG')}
          {f(`testemunhas[${i}].data_nascimento`, 'Data de nascimento', 'date')}
        </div>
      ))}
    </div>
  );

  return null;
}

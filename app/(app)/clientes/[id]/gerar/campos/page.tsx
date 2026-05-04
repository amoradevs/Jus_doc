import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { notFound, redirect } from 'next/navigation';
import { getRequiredContextualGroups } from '@/lib/document-generation/contextual-fields-resolver';
import { ContextualFieldsForm } from '@/components/contextual-fields-form';

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ codigos?: string; modo?: string }> };

export default async function CamposPage({ params, searchParams }: Props) {
  const user = await getCurrentUser();
  const { id } = await params;
  const { codigos = '', modo = 'direto' } = await searchParams;
  const templateCodes = codigos.split(',').filter(Boolean);

  if (templateCodes.length === 0) redirect(`/clientes/${id}/gerar`);

  const { data: clientRows } = await db
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', user.tenantId)
    .is('deletado_em', null)
    .limit(1);

  const client = clientRows?.[0];
  if (!client) notFound();

  const { data: contextualRows } = await db
    .from('client_contextual_data')
    .select('*')
    .eq('client_id', id)
    .limit(1);

  const contextual = contextualRows?.[0] ?? null;
  const required = await getRequiredContextualGroups(templateCodes);

  const missing = required.filter((group) => {
    const val = contextual?.[group as keyof typeof contextual];
    return !val || Object.keys(val as object).length === 0;
  });

  if (missing.length === 0) {
    redirect(`/clientes/${id}/gerar/resultado?codigos=${codigos}&modo=${modo}`);
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-foreground mb-1">Informações complementares</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Os documentos selecionados precisam dos dados abaixo para serem preenchidos.
      </p>
      <ContextualFieldsForm clientId={id} missingGroups={missing} codigos={codigos} modo={modo} />
    </div>
  );
}

import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { clients, client_contextual_data } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { getRequiredContextualGroups } from '@/lib/document-generation/contextual-fields-resolver';
import { ContextualFieldsForm } from '@/components/contextual-fields-form';

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ codigos?: string }> };

export default async function CamposPage({ params, searchParams }: Props) {
  const user = await getCurrentUser();
  const { id } = await params;
  const { codigos = '' } = await searchParams;
  const templateCodes = codigos.split(',').filter(Boolean);

  if (templateCodes.length === 0) redirect(`/clientes/${id}/gerar`);

  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.tenant_id, user.tenantId), isNull(clients.deletado_em)))
    .limit(1);

  if (!client) notFound();

  const [contextual] = await db
    .select()
    .from(client_contextual_data)
    .where(eq(client_contextual_data.client_id, id))
    .limit(1);

  const required = await getRequiredContextualGroups(templateCodes);

  const missing = required.filter((group) => {
    const val = contextual?.[group as keyof typeof contextual];
    return !val || Object.keys(val as object).length === 0;
  });

  if (missing.length === 0) {
    redirect(`/clientes/${id}/gerar/resultado?codigos=${codigos}`);
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Informações complementares</h1>
      <p className="text-slate-500 text-sm mb-6">
        Os documentos selecionados precisam dos dados abaixo para serem preenchidos.
      </p>
      <ContextualFieldsForm clientId={id} missingGroups={missing} codigos={codigos} />
    </div>
  );
}

import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { ClientForm } from '@/components/client-form';
import type { ClientInput } from '@/lib/validators/schemas';

export default async function EditarClientePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  const { id } = await params;

  const { data: rows } = await db
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', user.tenantId)
    .is('deletado_em', null)
    .limit(1);

  const client = rows?.[0];
  if (!client) notFound();

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground mb-6">Editar cliente</h1>
      <ClientForm mode="edit" clientId={id} defaultValues={{
        ...client,
        estado_civil: client.estado_civil as ClientInput['estado_civil'],
        endereco_complemento: client.endereco_complemento ?? undefined,
        nome_pai: client.nome_pai ?? undefined,
      }} />
    </div>
  );
}

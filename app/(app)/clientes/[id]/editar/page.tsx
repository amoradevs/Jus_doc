import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { clients } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { ClientForm } from '@/components/client-form';
import type { ClientInput } from '@/lib/validators/schemas';

export default async function EditarClientePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  const { id } = await params;

  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.tenant_id, user.tenantId), isNull(clients.deletado_em)))
    .limit(1);

  if (!client) notFound();

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Editar cliente</h1>
      <ClientForm mode="edit" clientId={id} defaultValues={{
        ...client,
        estado_civil: client.estado_civil as ClientInput['estado_civil'],
        endereco_complemento: client.endereco_complemento ?? undefined,
        nome_pai: client.nome_pai ?? undefined,
      }} />
    </div>
  );
}

import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ClientForm } from '@/components/client-form';
import { DeleteClientButton } from '@/components/delete-client-button';
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
      {/* Navegação */}
      <Link
        href={`/clientes/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {client.nome_completo}
      </Link>

      <h1 className="text-2xl font-bold text-foreground mb-6">Editar cliente</h1>

      <ClientForm
        mode="edit"
        clientId={id}
        defaultValues={{
          ...client,
          estado_civil: client.estado_civil as ClientInput['estado_civil'],
          endereco_complemento: client.endereco_complemento ?? undefined,
          nome_pai: client.nome_pai ?? undefined,
        }}
      />

      {/* Zona de perigo */}
      <div className="mt-10 pt-6 border-t border-border flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Excluir cliente</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Remove o cliente permanentemente do sistema.
          </p>
        </div>
        <DeleteClientButton clientId={id} clientName={client.nome_completo} />
      </div>
    </div>
  );
}

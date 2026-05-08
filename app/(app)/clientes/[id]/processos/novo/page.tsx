import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { maskCPF } from '@/lib/validators/cpf';
import { ProcessoForm } from '@/components/processo-form';

export default async function NovoProcessoPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  const { id } = await params;

  const { data: rows } = await db
    .from('clients')
    .select('id, nome_completo, cpf')
    .eq('id', id)
    .eq('tenant_id', user.tenantId)
    .is('deletado_em', null)
    .limit(1);

  const client = rows?.[0];
  if (!client) notFound();

  return (
    <div className="max-w-2xl">
      <Link
        href={`/clientes/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {client.nome_completo}
        <span className="text-muted-foreground/40 mx-1">·</span>
        <span className="font-mono text-xs">{maskCPF(client.cpf)}</span>
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Novo processo</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Cadastre um processo previdenciário para {client.nome_completo.split(' ')[0]}.
        </p>
      </div>

      <ProcessoForm clienteId={id} clienteNome={client.nome_completo} />
    </div>
  );
}

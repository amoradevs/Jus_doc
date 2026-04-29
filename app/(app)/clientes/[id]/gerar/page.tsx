import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { notFound, redirect } from 'next/navigation';
import { TemplateSelector } from '@/components/template-selector';
import Link from 'next/link';

export default async function GerarPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  const { id } = await params;

  const { data: clientRows } = await db
    .from('clients')
    .select('id, nome_completo')
    .eq('id', id)
    .eq('tenant_id', user.tenantId)
    .is('deletado_em', null)
    .limit(1);

  const client = clientRows?.[0];
  if (!client) notFound();

  const { data: settingsRows } = await db
    .from('office_settings')
    .select('advogada_principal_nome')
    .eq('tenant_id', user.tenantId)
    .limit(1);

  if (!settingsRows?.[0]?.advogada_principal_nome) {
    redirect('/configuracoes?aviso=preencha-antes-de-gerar');
  }

  const { data: templates } = await db
    .from('document_templates')
    .select('*')
    .eq('ativo', 'true');

  return (
    <div>
      <Link
        href={`/clientes/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {client.nome_completo}
      </Link>

      <h1 className="text-2xl font-bold text-foreground mb-1">Gerar documentos</h1>
      <p className="text-muted-foreground text-sm mb-6">Selecione os documentos que deseja gerar.</p>
      <TemplateSelector clientId={id} templates={templates ?? []} />
    </div>
  );
}

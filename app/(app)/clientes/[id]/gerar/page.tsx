import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { notFound, redirect } from 'next/navigation';
import { TemplateSelector } from '@/components/template-selector';

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
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Gerar documentos</h1>
      <p className="text-slate-500 text-sm mb-6">Cliente: {client.nome_completo}</p>
      <TemplateSelector clientId={id} templates={templates ?? []} />
    </div>
  );
}

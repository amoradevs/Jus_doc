import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { clients, office_settings, document_templates } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { TemplateSelector } from '@/components/template-selector';

export default async function GerarPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  const { id } = await params;

  const [client] = await db
    .select({ id: clients.id, nome_completo: clients.nome_completo })
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.tenant_id, user.tenantId), isNull(clients.deletado_em)))
    .limit(1);

  if (!client) notFound();

  const [settings] = await db
    .select({ nome: office_settings.advogada_principal_nome })
    .from(office_settings)
    .where(eq(office_settings.tenant_id, user.tenantId))
    .limit(1);

  if (!settings?.nome) {
    redirect('/configuracoes?aviso=preencha-antes-de-gerar');
  }

  const templates = await db
    .select()
    .from(document_templates)
    .where(eq(document_templates.ativo, 'true'));

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Gerar documentos</h1>
      <p className="text-slate-500 text-sm mb-6">Cliente: {client.nome_completo}</p>
      <TemplateSelector clientId={id} templates={templates} />
    </div>
  );
}

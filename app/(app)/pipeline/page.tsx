import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { KanbanBoard } from '@/components/kanban-board';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function PipelinePage() {
  const user = await getCurrentUser();

  // Buscar todos os clientes ativos com contagem de documentos
  const { data: clientRows } = await db
    .from('clients')
    .select('id,nome_completo,tipo_pedido,etapa_pipeline,observacao_pipeline,status_pedido,atualizado_em,data_proxima_audiencia,data_prazo,tipo_evento')
    .eq('tenant_id', user.tenantId)
    .is('deletado_em', null)
    .order('atualizado_em', { ascending: false });

  const clients = clientRows ?? [];

  // Buscar contagem de documentos por cliente
  const clientIds = clients.map((c: { id: string }) => c.id);

  let docsMap: Record<string, { total: number; recebidos: number }> = {};

  if (clientIds.length > 0) {
    const { data: docs } = await db
      .from('case_documents')
      .select('client_id,recebido')
      .eq('tenant_id', user.tenantId)
      .in('client_id', clientIds);

    if (docs) {
      for (const d of docs as { client_id: string; recebido: boolean }[]) {
        if (!docsMap[d.client_id]) docsMap[d.client_id] = { total: 0, recebidos: 0 };
        docsMap[d.client_id].total++;
        if (d.recebido) docsMap[d.client_id].recebidos++;
      }
    }
  }

  const enrichedClients = clients.map((c: {
    id: string;
    nome_completo: string;
    tipo_pedido: string | null;
    etapa_pipeline: string;
    observacao_pipeline: string | null;
    atualizado_em: string;
    data_proxima_audiencia: string | null;
    data_prazo: string | null;
    tipo_evento: string | null;
  }) => ({
    id: c.id,
    nome_completo: c.nome_completo,
    tipo_pedido: c.tipo_pedido,
    etapa_pipeline: c.etapa_pipeline || 'triagem',
    observacao_pipeline: c.observacao_pipeline,
    docs_total: docsMap[c.id]?.total ?? 0,
    docs_recebidos: docsMap[c.id]?.recebidos ?? 0,
    atualizado_em: c.atualizado_em,
    data_proxima_audiencia: c.data_proxima_audiencia ?? null,
    data_prazo: c.data_prazo ?? null,
    tipo_evento: c.tipo_evento ?? null,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Arraste os cards para mover entre etapas
          </p>
        </div>
        <Button asChild className="rounded-xl">
          <Link href="/clientes/novo">+ Novo cliente</Link>
        </Button>
      </div>

      <KanbanBoard clients={enrichedClients} />
    </div>
  );
}

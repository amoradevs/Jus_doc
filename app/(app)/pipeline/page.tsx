import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { KanbanBoard } from '@/components/kanban-board';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ encerrados?: string }>;
}) {
  const user = await getCurrentUser();
  const { encerrados } = await searchParams;
  const mostrarEncerrados = encerrados === '1';

  // Buscar processos (encerrados ocultos por padrão)
  let query = db
    .from('processos')
    .select(`
      id,
      numero_interno,
      tipo_beneficio,
      etapa_pipeline,
      observacao_pipeline,
      status_resultado,
      updated_at,
      data_proxima_audiencia,
      data_prazo,
      tipo_evento,
      cliente_id,
      clients(nome_completo)
    `)
    .eq('tenant_id', user.tenantId)
    .order('updated_at', { ascending: false });

  if (!mostrarEncerrados) {
    query = query.neq('etapa_pipeline', 'encerrado');
  }

  const { data: processoRows } = await query;

  type ProcessoRow = {
    id: string;
    numero_interno: string;
    tipo_beneficio: string | null;
    etapa_pipeline: string;
    observacao_pipeline: string | null;
    status_resultado: string;
    updated_at: string;
    data_proxima_audiencia: string | null;
    data_prazo: string | null;
    tipo_evento: string | null;
    cliente_id: string;
    clients: { nome_completo: string } | null;
  };

  const processos = (processoRows ?? []) as unknown as ProcessoRow[];

  // Buscar contagem de documentos por cliente (case_documents ainda é por cliente)
  const clientIds = [...new Set(processos.map((p) => p.cliente_id))];

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

  // Buscar prazos pendentes de todos os processos
  const processoIds = processos.map((p) => p.id);
  let prazosMap: Record<string, { data_limite: string; categoria: string; tipo: string; vencido: boolean }> = {};

  if (processoIds.length > 0) {
    const hoje = new Date().toISOString().slice(0, 10);
    const { data: prazosData } = await db
      .from('prazos')
      .select('id, processo_id, categoria, tipo, data_limite')
      .eq('tenant_id', user.tenantId)
      .eq('status', 'pendente')
      .in('processo_id', processoIds)
      .order('data_limite', { ascending: true });

    if (prazosData) {
      for (const pz of prazosData as { id: string; processo_id: string; categoria: string; tipo: string; data_limite: string }[]) {
        if (!prazosMap[pz.processo_id]) {
          prazosMap[pz.processo_id] = {
            data_limite: pz.data_limite,
            categoria: pz.categoria,
            tipo: pz.tipo,
            vencido: pz.data_limite < hoje,
          };
        }
      }
    }
  }

  const enrichedProcessos = processos.map((p) => ({
    id: p.id,
    numero_interno: p.numero_interno,
    cliente_id: p.cliente_id,
    nome_completo: p.clients?.nome_completo ?? '—',
    tipo_beneficio: p.tipo_beneficio,
    etapa_pipeline: p.etapa_pipeline || 'triagem',
    observacao_pipeline: p.observacao_pipeline,
    docs_total: docsMap[p.cliente_id]?.total ?? 0,
    docs_recebidos: docsMap[p.cliente_id]?.recebidos ?? 0,
    updated_at: p.updated_at,
    data_proxima_audiencia: p.data_proxima_audiencia ?? null,
    data_prazo: p.data_prazo ?? null,
    tipo_evento: p.tipo_evento ?? null,
    proximo_prazo: prazosMap[p.id] ?? null,
    tem_prazo_vencido: prazosMap[p.id]?.vencido ?? false,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pipeline</h1>
          <p className="hidden sm:block text-sm text-muted-foreground mt-0.5">
            Arraste os cards para mover entre etapas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={mostrarEncerrados ? '/pipeline' : '/pipeline?encerrados=1'}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-xl border border-border hover:bg-secondary/50"
          >
            {mostrarEncerrados ? 'Ocultar encerrados' : 'Ver encerrados'}
          </Link>
          <Button asChild className="rounded-xl">
            <Link href="/clientes/novo">+ Novo cliente</Link>
          </Button>
        </div>
      </div>

      {/* Dica mobile */}
      <div className="sm:hidden mb-4 flex items-center gap-2.5 bg-secondary/60 rounded-xl px-4 py-2.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground shrink-0">
          <path d="M5 9l4-4 4 4M9 5v14M19 15l-4 4-4-4M15 19V5"/>
        </svg>
        <p className="text-[11px] text-muted-foreground leading-snug">
          Deslize para ver as etapas · Use o ícone <strong className="font-semibold text-foreground">Mover</strong> em cada card para mudar de etapa
        </p>
      </div>

      <KanbanBoard processos={enrichedProcessos} mostrarEncerrados={mostrarEncerrados} />
    </div>
  );
}

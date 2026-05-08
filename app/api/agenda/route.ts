import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  const user = await getCurrentUser();
  const { searchParams } = new URL(req.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  if (!start || !end) {
    return NextResponse.json({ error: 'Parâmetros start e end são obrigatórios' }, { status: 400 });
  }

  const { data, error } = await db
    .from('processos')
    .select(`
      id,
      tipo_beneficio,
      etapa_pipeline,
      data_proxima_audiencia,
      data_prazo,
      tipo_evento,
      descricao_evento,
      cliente_id,
      clients(nome_completo)
    `)
    .eq('tenant_id', user.tenantId)
    .or(
      `and(data_proxima_audiencia.gte.${start},data_proxima_audiencia.lte.${end}),` +
      `and(data_prazo.gte.${start},data_prazo.lte.${end})`
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type AgendaRow = {
    id: string;
    tipo_beneficio: string | null;
    etapa_pipeline: string;
    data_proxima_audiencia: string | null;
    data_prazo: string | null;
    tipo_evento: string | null;
    descricao_evento: string | null;
    cliente_id: string;
    clients: { nome_completo: string } | null;
  };

  // Flatten legado (processos com eventos agendados)
  const legado = (data as unknown as AgendaRow[] ?? []).map((p) => ({
    id: p.id,
    cliente_id: p.cliente_id,
    nome_completo: p.clients?.nome_completo ?? '',
    tipo_pedido: p.tipo_beneficio,
    etapa_pipeline: p.etapa_pipeline,
    data_proxima_audiencia: p.data_proxima_audiencia,
    data_prazo: p.data_prazo,
    tipo_evento: p.tipo_evento,
    descricao_evento: p.descricao_evento,
    // campos de prazo estruturado (ausentes nos itens legados)
    prazo_id: null as string | null,
    prazo_categoria: null as string | null,
    prazo_tipo: null as string | null,
    numero_interno: null as string | null,
  }));

  // Prazos categoria evento ou comercial_interno no período
  const { data: prazosData } = await db
    .from('prazos')
    .select(`
      id,
      categoria,
      tipo,
      data_limite,
      processos!inner(
        id,
        numero_interno,
        cliente_id,
        clients(nome_completo)
      )
    `)
    .eq('tenant_id', user.tenantId)
    .eq('status', 'pendente')
    .in('categoria', ['evento', 'comercial_interno'])
    .gte('data_limite', start)
    .lte('data_limite', end);

  type PrazoAgendaRow = {
    id: string;
    categoria: string;
    tipo: string;
    data_limite: string;
    processos: {
      id: string;
      numero_interno: string;
      cliente_id: string;
      clients: { nome_completo: string } | null;
    };
  };

  const prazosAgenda = ((prazosData ?? []) as unknown as PrazoAgendaRow[]).map((pz) => ({
    id: pz.processos.id,
    cliente_id: pz.processos.cliente_id,
    nome_completo: pz.processos.clients?.nome_completo ?? '',
    tipo_pedido: null,
    etapa_pipeline: '',
    data_proxima_audiencia: pz.data_limite,
    data_prazo: null,
    tipo_evento: pz.categoria,
    descricao_evento: pz.tipo,
    prazo_id: pz.id,
    prazo_categoria: pz.categoria,
    prazo_tipo: pz.tipo,
    numero_interno: pz.processos.numero_interno,
  }));

  return NextResponse.json([...legado, ...prazosAgenda]);
}

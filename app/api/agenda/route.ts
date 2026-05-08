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

  // Flatten para manter compatibilidade com CalendarioSemanal
  const resultado = (data as unknown as AgendaRow[] ?? []).map((p) => ({
    id: p.id,
    cliente_id: p.cliente_id,
    nome_completo: p.clients?.nome_completo ?? '',
    tipo_pedido: p.tipo_beneficio,
    etapa_pipeline: p.etapa_pipeline,
    data_proxima_audiencia: p.data_proxima_audiencia,
    data_prazo: p.data_prazo,
    tipo_evento: p.tipo_evento,
    descricao_evento: p.descricao_evento,
  }));

  return NextResponse.json(resultado);
}

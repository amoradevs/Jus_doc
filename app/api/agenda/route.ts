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

  // "audiência está no range" OU "prazo está no range"
  const { data, error } = await db
    .from('clients')
    .select('id,nome_completo,etapa_pipeline,tipo_pedido,data_proxima_audiencia,data_prazo,tipo_evento,descricao_evento')
    .eq('tenant_id', user.tenantId)
    .is('deletado_em', null)
    .or(
      `and(data_proxima_audiencia.gte.${start},data_proxima_audiencia.lte.${end}),` +
      `and(data_prazo.gte.${start},data_prazo.lte.${end})`
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { processoSchema } from '@/lib/validators/schemas';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  const body = await req.json();

  const { cliente_id, ...rest } = body;

  if (!cliente_id) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'cliente_id obrigatório' } }, { status: 400 });
  }

  const parsed = processoSchema.safeParse(rest);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } }, { status: 400 });
  }

  // Verify client belongs to this tenant
  const { data: clientRow } = await db
    .from('clients')
    .select('id')
    .eq('id', cliente_id)
    .eq('tenant_id', user.tenantId)
    .is('deletado_em', null)
    .limit(1);

  if (!clientRow || clientRow.length === 0) {
    return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 });
  }

  const payload = {
    ...parsed.data,
    data_entrada: parsed.data.data_entrada || null,
    dib_pleiteada: parsed.data.dib_pleiteada || null,
    numero_protocolo_inss: parsed.data.numero_protocolo_inss || null,
    numero_processo_judicial: parsed.data.numero_processo_judicial || null,
    observacao_pipeline: parsed.data.observacao_pipeline || null,
    cliente_id,
    tenant_id: user.tenantId,
  };

  const { data: processo, error } = await db
    .from('processos')
    .insert(payload)
    .select('id, numero_interno')
    .single();

  if (error || !processo) {
    return NextResponse.json({ error: { code: 'DB_ERROR' } }, { status: 500 });
  }

  return NextResponse.json({ id: processo.id, numero_interno: processo.numero_interno }, { status: 201 });
}

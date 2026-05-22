import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const user = await getCurrentUser();
  const { id } = await params;

  const { data: clientRows } = await db
    .from('clients')
    .select('id')
    .eq('id', id)
    .eq('tenant_id', user.tenantId)
    .is('deletado_em', null)
    .limit(1);

  if (!clientRows || clientRows.length === 0) {
    return NextResponse.json({ error: { code: 'CLIENT_NOT_FOUND' } }, { status: 404 });
  }

  const { data } = await db
    .from('client_contextual_data')
    .select('*')
    .eq('client_id', id)
    .limit(1);

  return NextResponse.json(data?.[0] ?? {});
}

export async function PATCH(req: Request, { params }: Params) {
  const user = await getCurrentUser();
  const { id } = await params;

  const { data: clientRows } = await db
    .from('clients')
    .select('id')
    .eq('id', id)
    .eq('tenant_id', user.tenantId)
    .is('deletado_em', null)
    .limit(1);

  if (!clientRows || clientRows.length === 0) {
    return NextResponse.json({ error: { code: 'CLIENT_NOT_FOUND' } }, { status: 404 });
  }

  const body = await req.json();

  const { data: existing } = await db
    .from('client_contextual_data')
    .select('*')
    .eq('client_id', id)
    .limit(1);

  const prev = existing?.[0] ?? {};
  const merged = {
    representante_legal: body.representante_legal ?? prev.representante_legal ?? null,
    conjuge: body.conjuge ?? prev.conjuge ?? null,
    filho_dependente: body.filho_dependente ?? prev.filho_dependente ?? null,
    empresa_mei: body.empresa_mei ?? prev.empresa_mei ?? null,
    imovel: body.imovel ?? prev.imovel ?? null,
    testemunhas: body.testemunhas ?? prev.testemunhas ?? null,
  };

  if (existing && existing.length > 0) {
    await db.from('client_contextual_data').update(merged).eq('client_id', id);
  } else {
    await db.from('client_contextual_data').insert({ client_id: id, ...merged });
  }

  return NextResponse.json({ ok: true });
}

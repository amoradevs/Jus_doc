import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { clientSchema } from '@/lib/validators/schemas';
import { unmaskCPF } from '@/lib/validators/cpf';

type Params = { params: Promise<{ id: string }> };

async function getClientOrNotFound(id: string, tenantId: string) {
  const { data } = await db
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .is('deletado_em', null)
    .limit(1);
  return data?.[0] ?? null;
}

export async function GET(_req: Request, { params }: Params) {
  const user = await getCurrentUser();
  const { id } = await params;
  const client = await getClientOrNotFound(id, user.tenantId);
  if (!client) return NextResponse.json({ error: { code: 'CLIENT_NOT_FOUND' } }, { status: 404 });

  const { data: contextualRows } = await db
    .from('client_contextual_data')
    .select('*')
    .eq('client_id', id)
    .limit(1);

  return NextResponse.json({ ...client, contextual: contextualRows?.[0] ?? null });
}

export async function PUT(req: Request, { params }: Params) {
  const user = await getCurrentUser();
  const { id } = await params;
  const client = await getClientOrNotFound(id, user.tenantId);
  if (!client) return NextResponse.json({ error: { code: 'CLIENT_NOT_FOUND' } }, { status: 404 });

  const body = await req.json();
  const parsed = clientSchema.safeParse({ ...body, cpf: unmaskCPF(body.cpf ?? '') });
  if (!parsed.success) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } }, { status: 400 });
  }

  await db.from('clients').update({ ...parsed.data, atualizado_em: new Date().toISOString() }).eq('id', id);

  if (body.contextual) {
    const { data: existing } = await db
      .from('client_contextual_data')
      .select('id')
      .eq('client_id', id)
      .limit(1);

    if (existing && existing.length > 0) {
      await db.from('client_contextual_data').update(body.contextual).eq('client_id', id);
    } else {
      await db.from('client_contextual_data').insert({ client_id: id, ...body.contextual });
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Params) {
  const user = await getCurrentUser();
  const { id } = await params;
  const client = await getClientOrNotFound(id, user.tenantId);
  if (!client) return NextResponse.json({ error: { code: 'CLIENT_NOT_FOUND' } }, { status: 404 });

  await db.from('clients').update({ deletado_em: new Date().toISOString() }).eq('id', id);
  return NextResponse.json({ ok: true });
}

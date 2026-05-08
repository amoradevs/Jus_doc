import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  const { id: prazoId } = await params;

  const { data: prazo } = await db
    .from('prazos')
    .select('id, status')
    .eq('id', prazoId)
    .eq('tenant_id', user.tenantId)
    .limit(1);

  if (!prazo || prazo.length === 0) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }

  const atual = prazo[0];
  if (atual.status === 'cancelado') {
    return NextResponse.json({ error: 'Prazo já cancelado' }, { status: 409 });
  }

  await db
    .from('prazos')
    .update({ status: 'cancelado' })
    .eq('id', prazoId)
    .eq('tenant_id', user.tenantId);

  await db.from('prazo_logs').insert({
    prazo_id:        prazoId,
    tenant_id:       user.tenantId,
    status_anterior: atual.status,
    status_novo:     'cancelado',
    user_id:         user.id,
    anotacao:        null,
  });

  return NextResponse.json({ ok: true });
}

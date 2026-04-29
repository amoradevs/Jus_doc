import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { clients, client_contextual_data } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const user = await getCurrentUser();
  const { id } = await params;

  const [client] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.tenant_id, user.tenantId), isNull(clients.deletado_em)))
    .limit(1);

  if (!client) return NextResponse.json({ error: { code: 'CLIENT_NOT_FOUND' } }, { status: 404 });

  const body = await req.json();

  const [existing] = await db
    .select()
    .from(client_contextual_data)
    .where(eq(client_contextual_data.client_id, id))
    .limit(1);

  const merged = {
    representante_legal: body.representante_legal ?? existing?.representante_legal ?? null,
    conjuge: body.conjuge ?? existing?.conjuge ?? null,
    filho_dependente: body.filho_dependente ?? existing?.filho_dependente ?? null,
    empresa_mei: body.empresa_mei ?? existing?.empresa_mei ?? null,
    imovel: body.imovel ?? existing?.imovel ?? null,
  };

  if (existing) {
    await db.update(client_contextual_data).set(merged).where(eq(client_contextual_data.client_id, id));
  } else {
    await db.insert(client_contextual_data).values({ client_id: id, ...merged });
  }

  return NextResponse.json({ ok: true });
}

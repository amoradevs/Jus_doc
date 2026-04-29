import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { clients, client_contextual_data } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { clientSchema } from '@/lib/validators/schemas';
import { unmaskCPF } from '@/lib/validators/cpf';

type Params = { params: Promise<{ id: string }> };

async function getClientOrNotFound(id: string, tenantId: string) {
  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.tenant_id, tenantId), isNull(clients.deletado_em)))
    .limit(1);
  return client ?? null;
}

export async function GET(_req: Request, { params }: Params) {
  const user = await getCurrentUser();
  const { id } = await params;
  const client = await getClientOrNotFound(id, user.tenantId);
  if (!client) return NextResponse.json({ error: { code: 'CLIENT_NOT_FOUND' } }, { status: 404 });

  const [contextual] = await db
    .select()
    .from(client_contextual_data)
    .where(eq(client_contextual_data.client_id, id))
    .limit(1);

  return NextResponse.json({ ...client, contextual: contextual ?? null });
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

  await db.transaction(async (tx) => {
    await tx.update(clients)
      .set({ ...parsed.data, atualizado_em: new Date() })
      .where(eq(clients.id, id));

    if (body.contextual) {
      await tx.update(client_contextual_data)
        .set(body.contextual)
        .where(eq(client_contextual_data.client_id, id));
    }
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Params) {
  const user = await getCurrentUser();
  const { id } = await params;
  const client = await getClientOrNotFound(id, user.tenantId);
  if (!client) return NextResponse.json({ error: { code: 'CLIENT_NOT_FOUND' } }, { status: 404 });

  await db.update(clients).set({ deletado_em: new Date() }).where(eq(clients.id, id));
  return NextResponse.json({ ok: true });
}

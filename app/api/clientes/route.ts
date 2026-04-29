import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { clients, client_contextual_data } from '@/lib/db/schema';
import { eq, and, or, ilike, isNull } from 'drizzle-orm';
import { clientSchema } from '@/lib/validators/schemas';
import { unmaskCPF } from '@/lib/validators/cpf';

export async function GET(req: Request) {
  const user = await getCurrentUser();
  const url = new URL(req.url);
  const search = url.searchParams.get('search') ?? '';
  const page = parseInt(url.searchParams.get('page') ?? '1');
  const limit = 20;
  const offset = (page - 1) * limit;

  const searchFilter = search
    ? or(
        ilike(clients.nome_completo, `%${search}%`),
        ilike(clients.cpf, `%${unmaskCPF(search)}%`)
      )
    : undefined;

  const rows = await db
    .select()
    .from(clients)
    .where(and(eq(clients.tenant_id, user.tenantId), isNull(clients.deletado_em), searchFilter))
    .orderBy(clients.atualizado_em)
    .limit(limit)
    .offset(offset);

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  const body = await req.json();
  const parsed = clientSchema.safeParse({ ...body, cpf: unmaskCPF(body.cpf ?? '') });
  if (!parsed.success) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } }, { status: 400 });
  }

  const [existing] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.cpf, parsed.data.cpf), eq(clients.tenant_id, user.tenantId), isNull(clients.deletado_em)))
    .limit(1);

  if (existing) {
    return NextResponse.json({ error: { code: 'CPF_ALREADY_EXISTS', existing_client_id: existing.id } }, { status: 409 });
  }

  const [client] = await db
    .insert(clients)
    .values({ ...parsed.data, tenant_id: user.tenantId })
    .returning({ id: clients.id });

  await db.insert(client_contextual_data).values({ client_id: client.id });

  return NextResponse.json({ id: client.id }, { status: 201 });
}

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { clientSchema } from '@/lib/validators/schemas';
import { unmaskCPF } from '@/lib/validators/cpf';

export async function GET(req: Request) {
  const user = await getCurrentUser();
  const url = new URL(req.url);
  const search = url.searchParams.get('search') ?? '';
  const page = parseInt(url.searchParams.get('page') ?? '1');
  const limit = 20;
  const offset = (page - 1) * limit;

  let query = db
    .from('clients')
    .select('*')
    .eq('tenant_id', user.tenantId)
    .is('deletado_em', null)
    .order('atualizado_em', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    const term = unmaskCPF(search);
    query = query.or(`nome_completo.ilike.%${search}%,cpf.ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: { code: 'DB_ERROR' } }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  const body = await req.json();
  const parsed = clientSchema.safeParse({ ...body, cpf: unmaskCPF(body.cpf ?? '') });
  if (!parsed.success) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } }, { status: 400 });
  }

  const { data: existing } = await db
    .from('clients')
    .select('id, nome_completo')
    .eq('cpf', parsed.data.cpf)
    .eq('tenant_id', user.tenantId)
    .is('deletado_em', null)
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json({
      error: {
        code: 'CPF_ALREADY_EXISTS',
        existing_client_id: existing[0].id,
        nome: existing[0].nome_completo,
      },
    }, { status: 409 });
  }

  const { data: client, error } = await db
    .from('clients')
    .insert({ ...parsed.data, tenant_id: user.tenantId })
    .select('id')
    .single();

  if (error || !client) return NextResponse.json({ error: { code: 'DB_ERROR' } }, { status: 500 });

  await db.from('client_contextual_data').insert({ client_id: client.id });

  return NextResponse.json({ id: client.id }, { status: 201 });
}

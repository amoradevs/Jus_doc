import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { z } from 'zod';

const createPrazoSchema = z.object({
  categoria:   z.enum(['administrativo_inss', 'judicial', 'comercial_interno', 'evento']),
  tipo:        z.string().min(1, 'Tipo obrigatório'),
  descricao:   z.string().optional(),
  data_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  data_limite: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  dias_uteis:  z.boolean().default(false),
});

async function marcarPerdidos(processoId: string, tenantId: string, userId: string) {
  const hoje = new Date().toISOString().split('T')[0];

  const { data: vencidos } = await db
    .from('prazos')
    .select('id')
    .eq('processo_id', processoId)
    .eq('tenant_id', tenantId)
    .eq('status', 'pendente')
    .lt('data_limite', hoje);

  if (!vencidos || vencidos.length === 0) return;

  const ids = vencidos.map((p: { id: string }) => p.id);

  await db.from('prazos').update({ status: 'perdido' }).in('id', ids);

  // Auditoria
  const logs = ids.map((prazoId: string) => ({
    prazo_id:        prazoId,
    tenant_id:       tenantId,
    status_anterior: 'pendente',
    status_novo:     'perdido',
    user_id:         userId,
    anotacao:        'Transição automática — data limite ultrapassada',
  }));
  await db.from('prazo_logs').insert(logs);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  const { id: processoId } = await params;

  // Verifica pertencimento ao tenant
  const { data: proc } = await db
    .from('processos')
    .select('id')
    .eq('id', processoId)
    .eq('tenant_id', user.tenantId)
    .limit(1);

  if (!proc || proc.length === 0) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }

  // Transição automática: pendente + vencido → perdido
  await marcarPerdidos(processoId, user.tenantId, user.id);

  const { data, error } = await db
    .from('prazos')
    .select('*')
    .eq('processo_id', processoId)
    .eq('tenant_id', user.tenantId)
    .order('data_limite', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  const { id: processoId } = await params;

  const body = await req.json();
  const parsed = createPrazoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
      { status: 400 }
    );
  }

  // Verifica pertencimento ao tenant
  const { data: proc } = await db
    .from('processos')
    .select('id')
    .eq('id', processoId)
    .eq('tenant_id', user.tenantId)
    .limit(1);

  if (!proc || proc.length === 0) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }

  const { data: prazo, error } = await db
    .from('prazos')
    .insert({
      ...parsed.data,
      descricao:   parsed.data.descricao || null,
      processo_id: processoId,
      tenant_id:   user.tenantId,
      created_by:  user.id,
      status:      'pendente',
    })
    .select('*')
    .single();

  if (error || !prazo) {
    return NextResponse.json({ error: { code: 'DB_ERROR' } }, { status: 500 });
  }

  // Log de criação
  await db.from('prazo_logs').insert({
    prazo_id:        prazo.id,
    tenant_id:       user.tenantId,
    status_anterior: null,
    status_novo:     'pendente',
    user_id:         user.id,
    anotacao:        'Prazo criado',
  });

  return NextResponse.json(prazo, { status: 201 });
}

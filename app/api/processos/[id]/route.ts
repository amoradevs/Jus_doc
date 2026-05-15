import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';

const STATUS_VALIDOS = [
  'em_andamento', 'exigencia', 'deferido', 'indeferido',
  'recurso_administrativo', 'judicializado', 'arquivado',
] as const;

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  const { id } = await params;
  const body = await req.json();
  const { status_resultado } = body;

  if (!STATUS_VALIDOS.includes(status_resultado)) {
    return NextResponse.json({ error: 'status inválido' }, { status: 400 });
  }

  const { error } = await db
    .from('processos')
    .update({ status_resultado })
    .eq('id', id)
    .eq('tenant_id', user.tenantId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

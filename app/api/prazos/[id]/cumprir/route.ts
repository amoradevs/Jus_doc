import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { z } from 'zod';

const cumprirSchema = z.object({
  data_cumprimento:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  anotacao_cumprimento: z.string().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  const { id: prazoId } = await params;

  const body = await req.json();
  const parsed = cumprirSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
      { status: 400 }
    );
  }

  // Busca e verifica pertencimento
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
  if (atual.status === 'cumprido') {
    return NextResponse.json({ error: 'Prazo já cumprido' }, { status: 409 });
  }

  await db
    .from('prazos')
    .update({
      status:               'cumprido',
      data_cumprimento:     parsed.data.data_cumprimento,
      anotacao_cumprimento: parsed.data.anotacao_cumprimento || null,
    })
    .eq('id', prazoId)
    .eq('tenant_id', user.tenantId);

  await db.from('prazo_logs').insert({
    prazo_id:        prazoId,
    tenant_id:       user.tenantId,
    status_anterior: atual.status,
    status_novo:     'cumprido',
    user_id:         user.id,
    anotacao:        parsed.data.anotacao_cumprimento || null,
  });

  return NextResponse.json({ ok: true });
}

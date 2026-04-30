import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';

const agendaSchema = z.object({
  data_proxima_audiencia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  data_prazo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  tipo_evento: z.enum(['audiencia', 'pericia', 'consulta', 'prazo', 'outro']).nullable().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const parsed = agendaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const updates: Record<string, unknown> = {};
  if ('data_proxima_audiencia' in parsed.data) updates.data_proxima_audiencia = parsed.data.data_proxima_audiencia ?? null;
  if ('data_prazo' in parsed.data) updates.data_prazo = parsed.data.data_prazo ?? null;
  if ('tipo_evento' in parsed.data) updates.tipo_evento = parsed.data.tipo_evento ?? null;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: true });
  }

  const { error } = await db
    .from('clients')
    .update(updates)
    .eq('id', id)
    .eq('tenant_id', user.tenantId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { officeSettingsSchema } from '@/lib/validators/schemas';

export async function GET() {
  const user = await getCurrentUser();
  const { data, error } = await db
    .from('office_settings')
    .select('*')
    .eq('tenant_id', user.tenantId)
    .limit(1);

  if (error) return NextResponse.json(null);
  return NextResponse.json(data?.[0] ?? null);
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  const body = await req.json();
  const parsed = officeSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } }, { status: 400 });
  }

  const { data: existing } = await db
    .from('office_settings')
    .select('id')
    .eq('tenant_id', user.tenantId)
    .limit(1);

  if (existing && existing.length > 0) {
    await db.from('office_settings').update(parsed.data).eq('id', existing[0].id);
  } else {
    await db.from('office_settings').insert({ ...parsed.data, tenant_id: user.tenantId });
  }

  return NextResponse.json({ ok: true });
}

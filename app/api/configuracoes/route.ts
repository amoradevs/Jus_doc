import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { office_settings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { officeSettingsSchema } from '@/lib/validators/schemas';

export async function GET() {
  const user = await getCurrentUser();
  const [settings] = await db
    .select()
    .from(office_settings)
    .where(eq(office_settings.tenant_id, user.tenantId))
    .limit(1);
  return NextResponse.json(settings ?? null);
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  const body = await req.json();
  const parsed = officeSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } }, { status: 400 });
  }

  const [existing] = await db
    .select({ id: office_settings.id })
    .from(office_settings)
    .where(eq(office_settings.tenant_id, user.tenantId))
    .limit(1);

  if (existing) {
    await db.update(office_settings).set(parsed.data).where(eq(office_settings.id, existing.id));
  } else {
    await db.insert(office_settings).values({ ...parsed.data, tenant_id: user.tenantId });
  }

  return NextResponse.json({ ok: true });
}

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { createClient } from '@supabase/supabase-js';

const storage = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);

type Params = { params: Promise<{ packageId: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const user = await getCurrentUser();
  const { packageId } = await params;

  const { data: pkg } = await db
    .from('generation_packages')
    .select('id, zip_storage_path, client_id')
    .eq('id', packageId)
    .eq('tenant_id', user.tenantId)
    .limit(1)
    .single();

  if (!pkg) {
    return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 });
  }

  if (pkg.zip_storage_path) {
    await storage.storage.from('pacotes').remove([pkg.zip_storage_path]);
  }

  await db.from('generated_documents').delete().eq('package_id', packageId);
  await db.from('generation_packages').delete().eq('id', packageId);

  return NextResponse.json({ ok: true });
}

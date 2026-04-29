import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generation_packages } from '@/lib/db/schema';
import { lt, isNotNull, eq } from 'drizzle-orm';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const expirados = await db
    .select({ id: generation_packages.id, zip: generation_packages.zip_storage_path })
    .from(generation_packages)
    .where(
      isNotNull(generation_packages.zip_storage_path) &&
      lt(generation_packages.expira_em, new Date())
    );

  if (expirados.length === 0) return NextResponse.json({ deleted: 0 });

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
  const paths = expirados.map((p) => p.zip!).filter(Boolean);

  await supabase.storage.from(process.env.SUPABASE_STORAGE_BUCKET!).remove(paths);

  for (const pkg of expirados) {
    await db
      .update(generation_packages)
      .set({ zip_storage_path: null })
      .where(eq(generation_packages.id, pkg.id));
  }

  return NextResponse.json({ deleted: expirados.length });
}

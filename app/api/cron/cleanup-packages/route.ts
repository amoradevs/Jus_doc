import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date().toISOString();
  const { data: expirados } = await db
    .from('generation_packages')
    .select('id, zip_storage_path')
    .not('zip_storage_path', 'is', null)
    .lt('expira_em', now);

  if (!expirados || expirados.length === 0) return NextResponse.json({ deleted: 0 });

  const paths = expirados.map((p: { zip_storage_path: string }) => p.zip_storage_path).filter(Boolean);

  await db.storage.from(process.env.SUPABASE_STORAGE_BUCKET!).remove(paths);

  for (const pkg of expirados) {
    await db
      .from('generation_packages')
      .update({ zip_storage_path: null })
      .eq('id', pkg.id);
  }

  return NextResponse.json({ deleted: expirados.length });
}

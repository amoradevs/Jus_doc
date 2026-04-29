import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';

type Params = { params: Promise<{ packageId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const user = await getCurrentUser();
  const { packageId } = await params;

  const { data: rows } = await db
    .from('generation_packages')
    .select('*')
    .eq('id', packageId)
    .eq('tenant_id', user.tenantId)
    .limit(1);

  const pkg = rows?.[0];
  if (!pkg) return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 });
  if (!pkg.zip_storage_path) return NextResponse.json({ error: { code: 'EXPIRED' } }, { status: 410 });
  if (new Date(pkg.expira_em) < new Date()) return NextResponse.json({ error: { code: 'EXPIRED' } }, { status: 410 });

  const { data, error } = await db.storage
    .from(process.env.SUPABASE_STORAGE_BUCKET!)
    .download(pkg.zip_storage_path);

  if (error || !data) return NextResponse.json({ error: { code: 'DOWNLOAD_FAILED' } }, { status: 500 });

  const arrayBuffer = await data.arrayBuffer();
  return new Response(arrayBuffer, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="documentos_${packageId.slice(0, 8)}.zip"`,
    },
  });
}

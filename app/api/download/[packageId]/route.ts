import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { generation_packages } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { createClient } from '@supabase/supabase-js';

type Params = { params: Promise<{ packageId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const user = await getCurrentUser();
  const { packageId } = await params;

  const [pkg] = await db
    .select()
    .from(generation_packages)
    .where(and(eq(generation_packages.id, packageId), eq(generation_packages.tenant_id, user.tenantId)))
    .limit(1);

  if (!pkg) return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 });
  if (!pkg.zip_storage_path) return NextResponse.json({ error: { code: 'EXPIRED' } }, { status: 410 });
  if (new Date(pkg.expira_em) < new Date()) return NextResponse.json({ error: { code: 'EXPIRED' } }, { status: 410 });

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
  const { data, error } = await supabase.storage
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

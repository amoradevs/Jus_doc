import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { createClient } from '@supabase/supabase-js';

const storage = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

type Params = { params: Promise<{ packageId: string; codigo: string }> };

export async function GET(_req: Request, { params }: Params) {
  await getCurrentUser();
  const { packageId, codigo } = await params;

  const { data: rows } = await db
    .from('generated_documents')
    .select('nome_arquivo, storage_path')
    .eq('package_id', packageId)
    .eq('template_codigo', codigo)
    .limit(1);

  const doc = rows?.[0];
  if (!doc) return NextResponse.json({ error: 'Documento não encontrado.' }, { status: 404 });

  const { data, error } = await storage.storage
    .from(process.env.SUPABASE_STORAGE_BUCKET!)
    .download(doc.storage_path);

  if (error || !data) return NextResponse.json({ error: 'Erro ao baixar arquivo.' }, { status: 500 });

  const buffer = await data.arrayBuffer();
  const isDocx = doc.storage_path.endsWith('.docx');
  const contentType = isDocx
    ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    : 'application/pdf';
  return new Response(buffer, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${doc.nome_arquivo}"`,
    },
  });
}

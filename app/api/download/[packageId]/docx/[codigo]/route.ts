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

  const docxPath = doc.storage_path.replace(/\.pdf$/, '.docx');
  const nomeArquivo = doc.nome_arquivo.replace(/\.pdf$/, '.docx');

  const { data, error } = await storage.storage
    .from(process.env.SUPABASE_STORAGE_BUCKET!)
    .download(docxPath);

  if (error || !data) return NextResponse.json({ error: 'Arquivo Word não disponível para este documento.' }, { status: 404 });

  const buffer = await data.arrayBuffer();
  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${nomeArquivo}"`,
    },
  });
}

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import JSZip from 'jszip';
import { getCurrentUser } from '@/lib/auth-helpers';

function getStorage() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  const { tenantId } = user;

  const body = await req.json() as { paths?: string[] };
  const { paths } = body;

  if (!Array.isArray(paths) || paths.length === 0) {
    return NextResponse.json({ error: 'Nenhum path fornecido.' }, { status: 400 });
  }

  // Validar que todos os paths pertencem ao tenant
  const allowedPrefix = `documentos-escritorio/${tenantId}/`;
  const invalid = paths.find((p) => !p.startsWith(allowedPrefix));
  if (invalid) {
    return NextResponse.json({ error: 'Acesso negado a um ou mais arquivos.' }, { status: 403 });
  }

  const storage = getStorage();
  const zip = new JSZip();

  for (const path of paths) {
    const { data, error } = await storage.storage.from('templates').download(path);
    if (error || !data) {
      return NextResponse.json({ error: `Erro ao baixar: ${path}` }, { status: 500 });
    }
    const filename = path.split('/').pop() ?? path;
    const arrayBuffer = await data.arrayBuffer();
    zip.file(filename, arrayBuffer);
  }

  const zipArrayBuffer = await zip.generateAsync({ type: 'arraybuffer' });

  return new Response(zipArrayBuffer, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="documentos.zip"',
    },
  });
}

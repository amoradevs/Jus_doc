import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCurrentUser } from '@/lib/auth-helpers';

function getStorage() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  const { tenantId } = user;

  const { path, novoNome } = (await req.json()) as { path?: string; novoNome?: string };

  if (!path || !novoNome) {
    return NextResponse.json({ error: 'Parâmetros ausentes.' }, { status: 400 });
  }

  const allowedPrefix = `documentos-escritorio/${tenantId}/`;
  if (!path.startsWith(allowedPrefix)) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }

  // Preserve the original extension
  const oldName = path.split('/').pop() ?? '';
  const ext = oldName.includes('.') ? '.' + oldName.split('.').pop()!.toLowerCase() : '';
  const cleanName = novoNome.replace(/[<>:"/\\|?*\x00-\x1f]/g, '').trim();

  if (!cleanName) {
    return NextResponse.json({ error: 'Nome inválido.' }, { status: 422 });
  }

  const newName = cleanName.toLowerCase().endsWith(ext) ? cleanName : cleanName + ext;
  const newPath = `${allowedPrefix}${newName}`;

  if (path === newPath) {
    return NextResponse.json({ ok: true, path: newPath });
  }

  const storage = getStorage();
  const { error } = await storage.storage.from('templates').move(path, newPath);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, path: newPath, nome: newName });
}

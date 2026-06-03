import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCurrentUser } from '@/lib/auth-helpers';

function getStorage() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
}

function detectType(name: string): 'pdf' | 'docx' | 'outro' {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'docx') return 'docx';
  return 'outro';
}

export async function GET() {
  const user = await getCurrentUser();
  const { tenantId } = user;

  const storage = getStorage();
  const prefix = `documentos-escritorio/${tenantId}`;

  const { data, error } = await storage.storage.from('templates').list(prefix, { limit: 50 });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const files = (data ?? [])
    .filter((f) => f.name !== '.emptyFolderPlaceholder')
    .map((f) => ({
      nome: f.name,
      path: `${prefix}/${f.name}`,
      tipo: detectType(f.name),
      tamanho: f.metadata?.size ?? 0,
    }));

  return NextResponse.json({ files });
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  const { tenantId } = user;

  const { searchParams } = new URL(req.url);
  const path = searchParams.get('path');

  if (!path) {
    return NextResponse.json({ error: 'Parâmetro path ausente.' }, { status: 400 });
  }

  // Garantir que o path pertence ao tenant
  const allowedPrefix = `documentos-escritorio/${tenantId}/`;
  if (!path.startsWith(allowedPrefix)) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }

  const storage = getStorage();
  const { error } = await storage.storage.from('templates').remove([path]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

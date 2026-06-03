import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCurrentUser } from '@/lib/auth-helpers';

const ALLOWED_EXTENSIONS = ['pdf', 'docx'];

const MIME_MAP: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

function getStorage() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
}

function sanitizeFilename(name: string): string {
  const dotIdx = name.lastIndexOf('.');
  const base = dotIdx > 0 ? name.slice(0, dotIdx) : name;
  const ext = dotIdx > 0 ? name.slice(dotIdx).toLowerCase() : '';
  const safe = base
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove diacríticos
    .replace(/[^\w\s\-]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .trim();
  return (safe || 'arquivo') + ext;
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  const { tenantId } = user;

  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'Arquivo não encontrado no FormData.' }, { status: 400 });
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return NextResponse.json(
      { error: 'Tipo de arquivo não permitido. Aceitos: PDF, DOCX.' },
      { status: 422 },
    );
  }

  const contentType = MIME_MAP[ext] ?? file.type;
  const safeName = sanitizeFilename(file.name);
  const buffer = Buffer.from(await file.arrayBuffer());
  const path = `documentos-escritorio/${tenantId}/${safeName}`;
  const storage = getStorage();

  const { error } = await storage.storage.from('templates').upload(path, buffer, {
    upsert: true,
    contentType,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, path, nome: safeName });
}

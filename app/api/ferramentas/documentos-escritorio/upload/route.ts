import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCurrentUser } from '@/lib/auth-helpers';

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

function getStorage() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  const { tenantId } = user;

  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'Arquivo não encontrado no FormData.' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Tipo de arquivo não permitido. Aceitos: PDF, DOCX.' },
      { status: 422 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const path = `documentos-escritorio/${tenantId}/${file.name}`;
  const storage = getStorage();

  const { error } = await storage.storage.from('templates').upload(path, buffer, {
    upsert: true,
    contentType: file.type,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, path });
}

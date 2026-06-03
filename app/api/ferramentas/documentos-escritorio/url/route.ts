import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCurrentUser } from '@/lib/auth-helpers';

function getStorage() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
}

export async function GET(req: Request) {
  const user = await getCurrentUser();
  const { tenantId } = user;

  const { searchParams } = new URL(req.url);
  const path = searchParams.get('path');

  if (!path) {
    return NextResponse.json({ error: 'Parâmetro path ausente.' }, { status: 400 });
  }

  // Validar que o path pertence ao tenant
  const allowedPrefix = `documentos-escritorio/${tenantId}/`;
  if (!path.startsWith(allowedPrefix)) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }

  const storage = getStorage();
  const { data, error } = await storage.storage.from('templates').createSignedUrl(path, 300);

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: error?.message ?? 'Erro ao gerar URL.' }, { status: 500 });
  }

  return NextResponse.json({ url: data.signedUrl });
}

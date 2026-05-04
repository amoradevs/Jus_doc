import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { createClient } from '@supabase/supabase-js';

const storage = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);

export async function GET() {
  await getCurrentUser();
  const { data, error } = await db
    .from('document_templates')
    .select('*')
    .eq('ativo', 'true')
    .order('codigo');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  const form = await req.formData();

  const file = form.get('arquivo') as File | null;
  const nome = form.get('nome') as string;
  const categoria = form.get('categoria') as string;
  const codigo = form.get('codigo') as string;

  if (!file || !nome || !categoria || !codigo) {
    return NextResponse.json({ error: 'Campos obrigatórios: arquivo, nome, categoria, codigo' }, { status: 400 });
  }

  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!['docx', 'pdf'].includes(ext ?? '')) {
    return NextResponse.json({ error: 'Apenas arquivos .docx ou .pdf são aceitos' }, { status: 400 });
  }

  const storagePath = `templates/${codigo}_${nome.toLowerCase().replace(/\s+/g, '_')}.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error: uploadError } = await storage.storage
    .from('templates')
    .upload(storagePath, bytes, { contentType: file.type, upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: `Erro no upload: ${uploadError.message}` }, { status: 500 });
  }

  const { data, error } = await db
    .from('document_templates')
    .insert({
      codigo,
      nome,
      familia: categoria,
      formato: ext,
      caminho_arquivo: storagePath,
      storage_path: storagePath,
      campos_contextuais_necessarios: [],
      ativo: 'true',
      editado_em: new Date().toISOString(),
      editado_por: user.name,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

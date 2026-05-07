import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { applyMappings, type Mapping } from '@/lib/template-wizard/docx-replacer';
import { db } from '@/lib/db';
import { createClient } from '@supabase/supabase-js';

const storage = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);

export async function POST(req: Request) {
  const user = await getCurrentUser();

  let file: File | null = null;
  let mappingsRaw: string | null = null;
  let nome: string | null = null;
  let categoria: string | null = null;
  let codigo: string | null = null;
  let camposRaw: string | null = null;

  try {
    const form = await req.formData();
    file = form.get('arquivo') as File | null;
    mappingsRaw = form.get('mappings') as string | null;
    nome = form.get('nome') as string | null;
    categoria = form.get('categoria') as string | null;
    codigo = form.get('codigo') as string | null;
    camposRaw = form.get('campos_contextuais') as string | null;
  } catch {
    return NextResponse.json({ error: 'Erro ao ler o formulário.' }, { status: 400 });
  }

  if (!file || !nome || !categoria || !codigo) {
    return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 });
  }

  let mappings: Mapping[];
  let camposContextuais: string[];
  try {
    mappings = mappingsRaw ? JSON.parse(mappingsRaw) : [];
    camposContextuais = camposRaw ? JSON.parse(camposRaw) : [];
  } catch {
    return NextResponse.json({ error: 'Formato inválido de mapeamentos.' }, { status: 400 });
  }

  try {
    const buffer = await file.arrayBuffer();
    const docxToUpload = mappings.length > 0
      ? applyMappings(buffer, mappings)
      : Buffer.from(buffer);

    const storagePath = `templates/${codigo}_${nome.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}.docx`;

    const { error: uploadError } = await storage.storage
      .from('templates')
      .upload(storagePath, docxToUpload, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ error: `Erro no upload: ${uploadError.message}` }, { status: 500 });
    }

    const { data, error } = await db
      .from('document_templates')
      .insert({
        codigo,
        nome,
        familia: categoria,
        formato: 'docx',
        caminho_arquivo: storagePath,
        storage_path: storagePath,
        campos_contextuais_necessarios: camposContextuais,
        ativo: 'true',
        editado_em: new Date().toISOString(),
        editado_por: user.name,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

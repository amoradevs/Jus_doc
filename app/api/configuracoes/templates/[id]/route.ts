import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { createClient } from '@supabase/supabase-js';

const storage = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const user = await getCurrentUser();
  const { id } = await params;
  const body = await req.json();

  const allowed = ['nome', 'familia', 'ativo'];
  const updates: Record<string, unknown> = { editado_em: new Date().toISOString(), editado_por: user.name };
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  const { data, error } = await db
    .from('document_templates')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(req: Request, { params }: Params) {
  const user = await getCurrentUser();
  const { id } = await params;

  const form = await req.formData();
  const file = form.get('arquivo') as File | null;
  if (!file) return NextResponse.json({ error: 'Arquivo obrigatório' }, { status: 400 });

  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!['docx', 'pdf'].includes(ext ?? '')) {
    return NextResponse.json({ error: 'Apenas arquivos .docx ou .pdf são aceitos' }, { status: 400 });
  }

  const { data: template } = await db
    .from('document_templates')
    .select('codigo, nome, storage_path')
    .eq('id', id)
    .single();

  if (!template) return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 });

  const novoPath = `templates/${template.codigo}_${template.nome.toLowerCase().replace(/\s+/g, '_')}.${ext}`;

  // Remove arquivo antigo se o formato mudou (caminho diferente)
  if (template.storage_path && template.storage_path !== novoPath) {
    await storage.storage.from('templates').remove([template.storage_path]);
  }

  const bytes = await file.arrayBuffer();
  const { error: uploadError } = await storage.storage
    .from('templates')
    .upload(novoPath, bytes, { contentType: file.type, upsert: true });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data, error } = await db
    .from('document_templates')
    .update({
      storage_path: novoPath,
      caminho_arquivo: novoPath,
      formato: ext,
      editado_em: new Date().toISOString(),
      editado_por: user.name,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: Params) {
  await getCurrentUser();
  const { id } = await params;

  const { data: template } = await db
    .from('document_templates')
    .select('storage_path')
    .eq('id', id)
    .single();

  if (template?.storage_path) {
    await storage.storage.from('templates').remove([template.storage_path]);
  }

  const { error } = await db
    .from('document_templates')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

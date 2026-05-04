import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { createClient } from '@supabase/supabase-js';

const storage = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
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
    .update({ ativo: 'false' })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

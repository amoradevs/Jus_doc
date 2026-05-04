import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const user = await getCurrentUser();
  const { id } = await params;
  const body = await req.json();

  const updates: Record<string, unknown> = { atualizado_em: new Date().toISOString() };
  if ('conteudo_html' in body) updates.conteudo_html = body.conteudo_html;
  if ('status' in body) updates.status = body.status;
  if ('package_id' in body) updates.package_id = body.package_id;

  const { data, error } = await db
    .from('client_documents')
    .update(updates)
    .eq('id', id)
    .eq('tenant_id', user.tenantId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

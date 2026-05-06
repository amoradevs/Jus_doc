import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: Promise<{ packageId: string }> }) {
  await getCurrentUser();
  const { packageId } = await params;

  const { data } = await db
    .from('generated_documents')
    .select('template_codigo, nome_arquivo')
    .eq('package_id', packageId)
    .order('template_codigo');

  const docs = (data ?? []).map((d) => ({
    codigo: d.template_codigo,
    nome_arquivo: d.nome_arquivo,
  }));

  return NextResponse.json(docs);
}

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: Promise<{ packageId: string }> }) {
  await getCurrentUser();
  const { packageId } = await params;

  const { data: genDocs } = await db
    .from('generated_documents')
    .select('template_codigo, nome_arquivo')
    .eq('package_id', packageId)
    .order('template_codigo');

  if (!genDocs?.length) return NextResponse.json([]);

  const codigos = genDocs.map((d) => d.template_codigo);
  const { data: templates } = await db
    .from('document_templates')
    .select('codigo, nome')
    .in('codigo', codigos);

  const nomeMap = Object.fromEntries((templates ?? []).map((t) => [t.codigo, t.nome]));

  const docs = genDocs.map((d) => ({
    codigo: d.template_codigo,
    nome: nomeMap[d.template_codigo] ?? d.template_codigo,
    nome_arquivo: d.nome_arquivo,
  }));

  return NextResponse.json(docs);
}

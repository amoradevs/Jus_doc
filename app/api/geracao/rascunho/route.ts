import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { buildTemplateContext } from '@/lib/document-generation/template-context';
import { renderDocxTemplate } from '@/lib/document-generation/docx-renderer';
import mammoth from 'mammoth';

export const maxDuration = 30;

export async function GET(req: Request) {
  const user = await getCurrentUser();
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get('clientId');
  const codigos = searchParams.get('codigos')?.split(',').filter(Boolean) ?? [];

  if (!clientId || codigos.length === 0) {
    return NextResponse.json({ error: 'clientId e codigos são obrigatórios.' }, { status: 400 });
  }

  const { data: templates } = await db
    .from('document_templates')
    .select('*')
    .in('codigo', codigos)
    .eq('ativo', 'true');

  if (!templates?.length) {
    return NextResponse.json({ error: 'Nenhum template encontrado.' }, { status: 404 });
  }

  const context = await buildTemplateContext(clientId, user.tenantId);

  const docs = await Promise.all(
    templates.map(async (template) => {
      if (template.formato !== 'docx') {
        return { codigo: template.codigo, nome: template.nome, html: '', editavel: false };
      }

      try {
        const docxBuffer = await renderDocxTemplate(template.caminho_arquivo, context);
        const { value: html } = await mammoth.convertToHtml({ buffer: Buffer.from(docxBuffer) });
        return { codigo: template.codigo, nome: template.nome, html, editavel: true };
      } catch {
        return { codigo: template.codigo, nome: template.nome, html: '', editavel: false };
      }
    }),
  );

  // Preserva a ordem original dos codigos solicitados
  const ordered = codigos
    .map((c) => docs.find((d) => d.codigo === c))
    .filter(Boolean);

  return NextResponse.json(ordered);
}

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { buildTemplateContext } from '@/lib/document-generation/template-context';
import { renderPdfOverlay } from '@/lib/document-generation/pdf-overlay';
import { convertHtmlToPdf } from '@/lib/document-generation/html-to-pdf';
import path from 'path';
import JSZip from 'jszip';

export const maxDuration = 60;

type DocInput = {
  codigo: string;
  nome: string;
  html: string;
  editavel: boolean;
};

function normalizeName(name: string): string {
  return name
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 40);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();

  let clientId: string;
  let docs: DocInput[];
  try {
    const body = await req.json();
    clientId = body.clientId;
    docs = body.docs;
  } catch {
    return NextResponse.json({ error: 'Body inválido.' }, { status: 400 });
  }

  if (!clientId || !docs?.length) {
    return NextResponse.json({ error: 'clientId e docs são obrigatórios.' }, { status: 400 });
  }

  const context = await buildTemplateContext(clientId, user.tenantId);
  const clientNameNorm = normalizeName(context.cliente.nome_completo ?? 'CLIENTE');
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  const templateCodes = docs.map((d) => d.codigo);
  const { data: templates } = await db
    .from('document_templates')
    .select('*')
    .in('codigo', templateCodes);

  const zip = new JSZip();
  const generatedDocs: Array<{ codigo: string; nome_arquivo: string; buffer: Buffer }> = [];

  for (const doc of docs) {
    const template = templates?.find((t) => t.codigo === doc.codigo);
    let pdfBuffer: Buffer;

    if (doc.editavel && doc.html.trim()) {
      pdfBuffer = await convertHtmlToPdf(doc.html);
    } else {
      // Documentos PDF (overlay INSS) gerados pelo fluxo original
      const slug = template ? path.basename(template.caminho_arquivo, '.pdf') : doc.codigo;
      pdfBuffer = await renderPdfOverlay(slug, context);
    }

    const nomeArquivo = `${clientNameNorm}_${doc.codigo}_${normalizeName(doc.nome)}_${dateStr}.pdf`;
    zip.file(nomeArquivo, pdfBuffer);
    generatedDocs.push({ codigo: doc.codigo, nome_arquivo: nomeArquivo, buffer: pdfBuffer });
  }

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  const zipPath = `${user.tenantId}/${clientId}/${dateStr}_${Date.now()}.zip`;

  const { error: uploadError } = await db.storage
    .from(process.env.SUPABASE_STORAGE_BUCKET!)
    .upload(zipPath, zipBuffer, { contentType: 'application/zip' });

  if (uploadError) throw new Error(`Erro ao salvar ZIP: ${uploadError.message}`);

  const expira_em = new Date();
  expira_em.setDate(expira_em.getDate() + 30);

  const { data: pkg, error: pkgError } = await db
    .from('generation_packages')
    .insert({
      tenant_id: user.tenantId,
      client_id: clientId,
      templates_usados: templateCodes,
      zip_storage_path: zipPath,
      expira_em: expira_em.toISOString(),
    })
    .select('id')
    .single();

  if (pkgError || !pkg) return NextResponse.json({ error: 'Erro ao registrar pacote.' }, { status: 500 });

  for (const doc of generatedDocs) {
    const docPath = `${user.tenantId}/${clientId}/${pkg.id}/${doc.nome_arquivo}`;
    await db.storage
      .from(process.env.SUPABASE_STORAGE_BUCKET!)
      .upload(docPath, doc.buffer, { contentType: 'application/pdf' });

    await db.from('generated_documents').insert({
      package_id: pkg.id,
      template_codigo: doc.codigo,
      nome_arquivo: doc.nome_arquivo,
      storage_path: docPath,
    });
  }

  return NextResponse.json({
    packageId: pkg.id,
    documents: generatedDocs.map(({ codigo, nome_arquivo }) => ({ codigo, nome_arquivo })),
  });
}

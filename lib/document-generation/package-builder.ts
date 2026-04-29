import path from 'path';
import JSZip from 'jszip';
import { db } from '@/lib/db';
import { document_templates, generation_packages, generated_documents } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { buildTemplateContext } from './template-context';
import { renderDocxTemplate } from './docx-renderer';
import { convertDocxToPdf } from './pdf-converter';
import { renderPdfOverlay } from './pdf-overlay';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
}

function normalizeName(name: string): string {
  return name
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 40);
}

export type PackageResult = {
  packageId: string;
  documents: Array<{ codigo: string; nome_arquivo: string }>;
};

export async function buildDocumentPackage(
  clientId: string,
  templateCodes: string[],
  tenantId: string
): Promise<PackageResult> {
  const context = await buildTemplateContext(clientId, tenantId);
  const clientNameNorm = normalizeName(context.cliente.nome_completo ?? 'CLIENTE');
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  const templates = await db
    .select()
    .from(document_templates)
    .where(inArray(document_templates.codigo, templateCodes));

  const zip = new JSZip();
  const docs: Array<{ codigo: string; nome_arquivo: string; buffer: Buffer }> = [];

  for (const template of templates) {
    let pdfBuffer: Buffer;

    if (template.formato === 'docx') {
      const docxBuffer = await renderDocxTemplate(template.caminho_arquivo, context);
      pdfBuffer = await convertDocxToPdf(docxBuffer);
    } else {
      const slug = path.basename(template.caminho_arquivo, '.pdf');
      pdfBuffer = await renderPdfOverlay(slug, context);
    }

    const nomeArquivo = `${clientNameNorm}_${template.codigo}_${normalizeName(template.nome)}_${dateStr}.pdf`;
    zip.file(nomeArquivo, pdfBuffer);
    docs.push({ codigo: template.codigo, nome_arquivo: nomeArquivo, buffer: pdfBuffer });
  }

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

  const supabase = getSupabase();
  const zipPath = `${tenantId}/${clientId}/${dateStr}_${Date.now()}.zip`;

  const { error: uploadError } = await supabase.storage
    .from(process.env.SUPABASE_STORAGE_BUCKET!)
    .upload(zipPath, zipBuffer, { contentType: 'application/zip' });

  if (uploadError) throw new Error(`Erro ao salvar ZIP: ${uploadError.message}`);

  const expira_em = new Date();
  expira_em.setDate(expira_em.getDate() + 30);

  const [pkg] = await db.insert(generation_packages).values({
    tenant_id: tenantId,
    client_id: clientId,
    templates_usados: templateCodes,
    zip_storage_path: zipPath,
    expira_em,
  }).returning({ id: generation_packages.id });

  for (const doc of docs) {
    const docPath = `${tenantId}/${clientId}/${pkg.id}/${doc.nome_arquivo}`;
    await supabase.storage
      .from(process.env.SUPABASE_STORAGE_BUCKET!)
      .upload(docPath, doc.buffer, { contentType: 'application/pdf' });

    await db.insert(generated_documents).values({
      package_id: pkg.id,
      template_codigo: doc.codigo,
      nome_arquivo: doc.nome_arquivo,
      storage_path: docPath,
    });
  }

  return {
    packageId: pkg.id,
    documents: docs.map(({ codigo, nome_arquivo }) => ({ codigo, nome_arquivo })),
  };
}

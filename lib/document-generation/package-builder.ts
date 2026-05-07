import path from 'path';
import fs from 'fs';
import JSZip from 'jszip';
import { createClient } from '@supabase/supabase-js';
import { db } from '@/lib/db';
import { buildTemplateContext } from './template-context';
import { renderDocxTemplate } from './docx-renderer';
import { convertDocxToPdf } from './pdf-converter';
import { renderPdfOverlay } from './pdf-overlay';

const storage = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);

async function getTemplateBuffer(template: { caminho_arquivo: string; storage_path: string | null }): Promise<Buffer> {
  if (template.storage_path) {
    const { data, error } = await storage.storage.from('templates').download(template.storage_path);
    if (error || !data) throw new Error(`Erro ao baixar template do Storage: ${error?.message}`);
    return Buffer.from(await data.arrayBuffer());
  }
  return fs.readFileSync(path.resolve(process.cwd(), template.caminho_arquivo));
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
  documents: Array<{ codigo: string; nome: string; nome_arquivo: string }>;
};

export async function buildDocumentPackage(
  clientId: string,
  templateCodes: string[],
  tenantId: string
): Promise<PackageResult> {
  const context = await buildTemplateContext(clientId, tenantId);
  const clientNameNorm = normalizeName(context.cliente.nome_completo ?? 'CLIENTE');
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  const { data: templates } = await db
    .from('document_templates')
    .select('*')
    .in('codigo', templateCodes);

  const zip = new JSZip();
  const docs: Array<{ codigo: string; nome: string; nome_arquivo: string; buffer: Buffer }> = [];

  for (const template of templates ?? []) {
    let pdfBuffer: Buffer;

    if (template.formato === 'docx') {
      const templateBuffer = await getTemplateBuffer(template);
      const docxBuffer = await renderDocxTemplate(templateBuffer, context);
      pdfBuffer = await convertDocxToPdf(docxBuffer);
    } else {
      const slug = path.basename(template.caminho_arquivo, '.pdf');
      pdfBuffer = await renderPdfOverlay(slug, context);
    }

    const nomeArquivo = `${clientNameNorm}_${template.codigo}_${normalizeName(template.nome)}_${dateStr}.pdf`;
    zip.file(nomeArquivo, pdfBuffer);
    docs.push({ codigo: template.codigo, nome: template.nome, nome_arquivo: nomeArquivo, buffer: pdfBuffer });
  }

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

  const zipPath = `${tenantId}/${clientId}/${dateStr}_${Date.now()}.zip`;
  const { error: uploadError } = await db.storage
    .from(process.env.SUPABASE_STORAGE_BUCKET!)
    .upload(zipPath, zipBuffer, { contentType: 'application/zip' });

  if (uploadError) throw new Error(`Erro ao salvar ZIP: ${uploadError.message}`);

  const expira_em = new Date();
  expira_em.setDate(expira_em.getDate() + 30);

  const { data: pkg, error: pkgError } = await db
    .from('generation_packages')
    .insert({
      tenant_id: tenantId,
      client_id: clientId,
      templates_usados: templateCodes,
      zip_storage_path: zipPath,
      expira_em: expira_em.toISOString(),
    })
    .select('id')
    .single();

  if (pkgError || !pkg) throw new Error('Erro ao registrar pacote no banco');

  for (const doc of docs) {
    const docPath = `${tenantId}/${clientId}/${pkg.id}/${doc.nome_arquivo}`;
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

  return {
    packageId: pkg.id,
    documents: docs.map(({ codigo, nome, nome_arquivo }) => ({ codigo, nome, nome_arquivo })),
  };
}

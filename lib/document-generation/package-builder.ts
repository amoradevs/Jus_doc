import path from 'path';
import fs from 'fs';
import JSZip from 'jszip';
import { createClient } from '@supabase/supabase-js';
import { db } from '@/lib/db';
import { buildTemplateContext } from './template-context';
import type { AdvogadasSelecionadas } from './template-context';
import { CATALOGO_TEMPLATES } from './cadeia-documental';
import type { Cenario } from './cadeia-documental';
import { renderDocxTemplate } from './docx-renderer';
import { convertDocxToPdf, isPdfConverterAvailable } from './pdf-converter';
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
  tenantId: string,
  cenario?: Cenario,
  advogadas: AdvogadasSelecionadas = 'ambas',
  processoId?: string,
  incluirAssinaturaLidiane = true,
): Promise<PackageResult> {
  const context = await buildTemplateContext(clientId, tenantId, cenario, advogadas, processoId, incluirAssinaturaLidiane);
  const clientNameNorm = normalizeName(context.cliente.nome_completo ?? 'CLIENTE');
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  const { data: templates } = await db
    .from('document_templates')
    .select('*')
    .in('codigo', templateCodes);

  const zip = new JSZip();
  const docs: Array<{ codigo: string; nome: string; nome_arquivo: string; buffer: Buffer; docxBuffer: Buffer | null; contentType: string }> = [];

  const usarPdf = isPdfConverterAvailable();

  for (const template of templates ?? []) {
    let fileBuffer: Buffer;
    let docxBuffer: Buffer | null = null;
    let extensao: string;
    let contentType: string;

    // Contrato e Procuração sempre saem com ambas advogadas, independente da seleção do modal
    const categoriaTemplate = CATALOGO_TEMPLATES.find((t) => t.codigo === template.codigo)?.categoria;
    const ctx = (categoriaTemplate === 'contrato' || categoriaTemplate === 'procuracao')
      ? { ...context, mostrar_lidiane: true, mostrar_alcione: true, tem_duas_advogadas: true, apenas_lidiane: false, apenas_alcione: false, incluir_assinatura_lidiane: false }
      : context;

    if (template.formato === 'docx') {
      const templateBuffer = await getTemplateBuffer(template);
      docxBuffer = await renderDocxTemplate(templateBuffer, ctx);
      if (usarPdf) {
        fileBuffer = await convertDocxToPdf(docxBuffer);
        extensao = 'pdf';
        contentType = 'application/pdf';
      } else {
        fileBuffer = docxBuffer;
        extensao = 'docx';
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      }
    } else {
      const slug = path.basename(template.caminho_arquivo, '.pdf');
      fileBuffer = await renderPdfOverlay(slug, ctx);
      extensao = 'pdf';
      contentType = 'application/pdf';
    }

    const nomeArquivo = `${clientNameNorm}_${template.codigo}_${normalizeName(template.nome)}_${dateStr}.${extensao}`;
    zip.file(nomeArquivo, fileBuffer);
    docs.push({ codigo: template.codigo, nome: template.nome, nome_arquivo: nomeArquivo, buffer: fileBuffer, docxBuffer, contentType });
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
      .upload(docPath, doc.buffer, { contentType: doc.contentType });

    if (doc.docxBuffer) {
      const docxPath = docPath.replace(/\.pdf$/, '.docx');
      await db.storage
        .from(process.env.SUPABASE_STORAGE_BUCKET!)
        .upload(docxPath, doc.docxBuffer, {
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });
    }

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

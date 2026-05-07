import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { TemplateContext } from './template-context';

type FieldMap = {
  value: (ctx: TemplateContext) => string;
  page: number;
  x: number;
  y: number;
  fontSize?: number;
};

function dataExtenso(ctx: TemplateContext): string {
  return `${ctx.doc.dia_assinatura} de ${ctx.doc.mes_assinatura_extenso} de ${ctx.doc.ano_assinatura}`;
}

// Coordenadas mapeadas manualmente para cada PDF do INSS.
// Valores em pontos (pt) a partir do canto inferior esquerdo.
// ATENÇÃO: requer ajuste fino com os PDFs reais.
const FIELD_MAPS: Record<string, FieldMap[]> = {
  '13_declaracao_separacao_fato_inss': [
    { value: (c) => c.cliente.nome_completo, page: 0, x: 110, y: 630, fontSize: 10 },
    { value: (c) => c.cliente.cpf, page: 0, x: 110, y: 610, fontSize: 10 },
    { value: (c) => c.separacao.data, page: 0, x: 280, y: 610, fontSize: 10 },
    { value: (c) => dataExtenso(c), page: 0, x: 110, y: 200, fontSize: 10 },
  ],
  '14_termo_representacao_inss': [
    { value: (c) => c.cliente.nome_completo, page: 0, x: 130, y: 560, fontSize: 10 },
    { value: (c) => c.cliente.cpf, page: 0, x: 130, y: 540, fontSize: 10 },
    { value: (c) => c.cliente.rg, page: 0, x: 340, y: 540, fontSize: 10 },
    { value: (c) => dataExtenso(c), page: 0, x: 130, y: 180, fontSize: 10 },
  ],
  '15_termo_responsabilidade_inss': [
    { value: (c) => c.cliente.nome_completo, page: 0, x: 130, y: 560, fontSize: 10 },
    { value: (c) => c.cliente.cpf, page: 0, x: 130, y: 540, fontSize: 10 },
    { value: (c) => dataExtenso(c), page: 0, x: 130, y: 180, fontSize: 10 },
  ],
};

export async function renderPdfOverlay(templateCode: string, context: TemplateContext): Promise<Buffer> {
  const slug = templateCode.replace(/^\d+_/, '').replace('.pdf', '');
  const fieldMap = FIELD_MAPS[`${templateCode.split('_').slice(0, -1).join('_')}_${slug}`]
    ?? FIELD_MAPS[templateCode]
    ?? [];

  const filePath = path.resolve(process.cwd(), `templates/${templateCode}.pdf`);
  const existingPdf = fs.readFileSync(filePath);
  const pdfDoc = await PDFDocument.load(existingPdf);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();

  for (const field of fieldMap) {
    const page = pages[field.page];
    if (!page) continue;
    page.drawText(field.value(context), {
      x: field.x,
      y: field.y,
      size: field.fontSize ?? 10,
      font,
      color: rgb(0, 0, 0),
    });
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

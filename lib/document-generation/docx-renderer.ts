import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import type { TemplateContext } from './template-context';

export async function renderDocxTemplate(templatePath: string, context: TemplateContext): Promise<Buffer> {
  const fullPath = path.resolve(process.cwd(), templatePath);
  const content = fs.readFileSync(fullPath);
  const zip = new PizZip(content);

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: '{', end: '}' },
    // Retorna string vazia para variáveis não encontradas (evita erros)
    nullGetter: () => '',
  });

  doc.render(context);

  const buf = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  return buf;
}

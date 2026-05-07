import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import type { TemplateContext } from './template-context';

export async function renderDocxTemplate(templatePathOrBuffer: string | Buffer, context: TemplateContext): Promise<Buffer> {
  const content = Buffer.isBuffer(templatePathOrBuffer)
    ? templatePathOrBuffer
    : fs.readFileSync(path.resolve(process.cwd(), templatePathOrBuffer));
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

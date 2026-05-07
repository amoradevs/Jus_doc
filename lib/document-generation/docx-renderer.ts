import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const expressions = require('angular-expressions');
import type { TemplateContext } from './template-context';

function angularParser(tag: string) {
  if (tag === '.') return { get: (scope: unknown) => scope };
  const expr = expressions.compile(tag.replace(/['']/g, "'").replace(/[""]/g, '"'));
  return { get: (scope: unknown) => expr(scope) };
}

export async function renderDocxTemplate(
  templatePathOrBuffer: string | Buffer,
  context: TemplateContext,
): Promise<Buffer> {
  const content = Buffer.isBuffer(templatePathOrBuffer)
    ? templatePathOrBuffer
    : fs.readFileSync(path.resolve(process.cwd(), templatePathOrBuffer));

  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    parser: angularParser,
    nullGetter: () => '',
  });

  doc.render(context);

  return doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
}

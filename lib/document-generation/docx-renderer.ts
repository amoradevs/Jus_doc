import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const expressions = require('angular-expressions');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ImageModule = require('docxtemplater-image-module-free');
import type { TemplateContext } from './template-context';

function angularParser(tag: string) {
  if (tag === '.') return { get: (scope: unknown) => scope };
  const expr = expressions.compile(tag.replace(/['']/g, "'").replace(/[""]/g, '"'));
  return { get: (scope: unknown) => expr(scope) };
}

const IMAGE_SIZES: Record<string, [number, number]> = {
  logo_inss: [480, 165],
};

function makeImageModule() {
  return new ImageModule({
    centered: false,
    getImage: (tagValue: string) => {
      const imgPath = path.resolve(process.cwd(), tagValue);
      return fs.readFileSync(imgPath);
    },
    getSize: (_img: Buffer, _tagValue: string, tagName: string) =>
      IMAGE_SIZES[tagName] ?? [180, 50],
  });
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
    modules: [makeImageModule()],
  });

  doc.render(context);

  return doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
}

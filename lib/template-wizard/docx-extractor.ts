import mammoth from 'mammoth';

export type ExtractedDoc = {
  text: string;
  html: string;
};

export async function extractDocx(buffer: ArrayBuffer): Promise<ExtractedDoc> {
  const buf = Buffer.from(buffer);
  const [textResult, htmlResult] = await Promise.all([
    mammoth.extractRawText({ buffer: buf }),
    mammoth.convertToHtml({ buffer: buf }),
  ]);
  return { text: textResult.value, html: htmlResult.value };
}

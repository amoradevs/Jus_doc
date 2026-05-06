import CloudConvert from 'cloudconvert';

let cloudConvert: CloudConvert | null = null;

function getClient(): CloudConvert {
  if (!cloudConvert) {
    if (!process.env.PDF_CONVERTER_API_KEY) throw new Error('PDF_CONVERTER_API_KEY não configurada');
    cloudConvert = new CloudConvert(process.env.PDF_CONVERTER_API_KEY);
  }
  return cloudConvert;
}

function wrapHtml(body: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
  body {
    font-family: Arial, sans-serif;
    font-size: 12pt;
    line-height: 1.6;
    margin: 2.5cm;
    color: #000;
  }
  p { margin-bottom: 0.8em; text-align: justify; }
  h1, h2, h3 { text-align: center; margin-bottom: 1em; }
  ul, ol { margin-left: 1.5em; margin-bottom: 0.8em; }
  .tiptap-text-left { text-align: left; }
  .tiptap-text-center { text-align: center; }
  .tiptap-text-right { text-align: right; }
  .tiptap-text-justify { text-align: justify; }
  [style*="text-align: left"] { text-align: left !important; }
  [style*="text-align: center"] { text-align: center !important; }
  [style*="text-align: right"] { text-align: right !important; }
  [style*="text-align: justify"] { text-align: justify !important; }
</style>
</head>
<body>${body}</body>
</html>`;
}

export async function convertHtmlToPdf(htmlBody: string): Promise<Buffer> {
  const client = getClient();
  const fullHtml = wrapHtml(htmlBody);

  const job = await client.jobs.create({
    tasks: {
      upload: { operation: 'import/upload' },
      convert: {
        operation: 'convert',
        input: 'upload',
        input_format: 'html',
        output_format: 'pdf',
        engine: 'chrome',
      },
      export: {
        operation: 'export/url',
        input: 'convert',
      },
    },
  });

  const uploadTask = job.tasks.find((t) => t.name === 'upload');
  if (!uploadTask) throw new Error('Upload task não encontrada');

  const htmlBytes = Buffer.from(fullHtml, 'utf-8');
  const blob = new Blob([htmlBytes], { type: 'text/html' });
  await client.tasks.upload(uploadTask, blob, 'documento.html');

  const completed = await client.jobs.wait(job.id);
  const exportTask = completed.tasks.find((t) => t.name === 'export');
  const fileUrl = exportTask?.result?.files?.[0]?.url;
  if (!fileUrl) throw new Error('URL de download não encontrada após conversão HTML→PDF');

  const res = await fetch(fileUrl);
  if (!res.ok) throw new Error(`Falha ao baixar PDF: ${res.status}`);

  return Buffer.from(await res.arrayBuffer());
}

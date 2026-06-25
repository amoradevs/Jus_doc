import CloudConvert from 'cloudconvert';

let cloudConvert: CloudConvert | null = null;

export function isPdfConverterAvailable(): boolean {
  return !!process.env.PDF_CONVERTER_API_KEY;
}

function getClient(): CloudConvert {
  if (!cloudConvert) {
    if (!process.env.PDF_CONVERTER_API_KEY) throw new Error('PDF_CONVERTER_API_KEY não configurada');
    cloudConvert = new CloudConvert(process.env.PDF_CONVERTER_API_KEY);
  }
  return cloudConvert;
}

export async function convertDocxToPdf(docxBuffer: Buffer): Promise<Buffer> {
  const client = getClient();

  const job = await client.jobs.create({
    tasks: {
      upload: { operation: 'import/upload' },
      convert: {
        operation: 'convert',
        input: 'upload',
        output_format: 'pdf',
        engine: 'libreoffice',
      },
      export: {
        operation: 'export/url',
        input: 'convert',
      },
    },
  });

  const uploadTask = job.tasks.find((t) => t.name === 'upload');
  if (!uploadTask) throw new Error('Upload task não encontrada');

  // Passa o Buffer diretamente — evita problemas de Blob/ArrayBuffer em Node.js 18+
  const safeBuffer = Buffer.from(docxBuffer.buffer, docxBuffer.byteOffset, docxBuffer.byteLength);
  await client.tasks.upload(uploadTask, safeBuffer, 'documento.docx');

  const completed = await client.jobs.wait(job.id);

  const convertTask = completed.tasks.find((t) => t.name === 'convert');
  if (convertTask?.status === 'error') {
    throw new Error(`Falha na conversão DOCX→PDF: ${convertTask.message ?? 'erro desconhecido no CloudConvert'}`);
  }

  const exportTask = completed.tasks.find((t) => t.name === 'export');
  if (exportTask?.status === 'error') {
    throw new Error(`Falha no export CloudConvert: ${exportTask.message ?? 'erro desconhecido'}`);
  }

  const fileUrl = exportTask?.result?.files?.[0]?.url;
  if (!fileUrl) throw new Error('URL de download não encontrada após conversão');

  const res = await fetch(fileUrl);
  if (!res.ok) throw new Error(`Falha ao baixar PDF convertido: ${res.status}`);

  return Buffer.from(await res.arrayBuffer());
}

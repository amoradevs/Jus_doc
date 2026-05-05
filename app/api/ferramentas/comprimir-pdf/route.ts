import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import CloudConvert from 'cloudconvert';

function getClient(): CloudConvert {
  if (!process.env.PDF_CONVERTER_API_KEY) {
    throw new Error('PDF_CONVERTER_API_KEY não configurada');
  }
  return new CloudConvert(process.env.PDF_CONVERTER_API_KEY);
}

export async function POST(req: Request) {
  await getCurrentUser();

  if (!process.env.PDF_CONVERTER_API_KEY) {
    return NextResponse.json(
      { error: 'Compressor indisponível: chave da API não configurada.' },
      { status: 503 },
    );
  }

  const form = await req.formData();
  const file = form.get('arquivo') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
  }

  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext !== 'pdf') {
    return NextResponse.json({ error: 'Apenas arquivos PDF são aceitos.' }, { status: 400 });
  }

  const MAX_MB = 50;
  if (file.size > MAX_MB * 1024 * 1024) {
    return NextResponse.json({ error: `Arquivo muito grande. Limite: ${MAX_MB} MB.` }, { status: 400 });
  }

  const client = getClient();

  const job = await client.jobs.create({
    tasks: {
      upload: { operation: 'import/upload' },
      optimize: {
        operation: 'optimize',
        input: 'upload',
        input_format: 'pdf',
        // profile web = compressão balanceada, preserva legibilidade
        profile: 'web',
      },
      export: {
        operation: 'export/url',
        input: 'optimize',
      },
    },
  });

  const uploadTask = job.tasks.find((t) => t.name === 'upload');
  if (!uploadTask) throw new Error('Upload task não encontrada.');

  const bytes = await file.arrayBuffer();
  await client.tasks.upload(uploadTask, new Blob([bytes]), file.name);

  const completed = await client.jobs.wait(job.id);
  const exportTask = completed.tasks.find((t) => t.name === 'export');
  const fileUrl = exportTask?.result?.files?.[0]?.url;

  if (!fileUrl) {
    return NextResponse.json({ error: 'Falha ao obter URL do arquivo comprimido.' }, { status: 500 });
  }

  const compressed = await fetch(fileUrl);
  if (!compressed.ok) {
    return NextResponse.json({ error: 'Falha ao baixar arquivo comprimido.' }, { status: 500 });
  }

  const buffer = await compressed.arrayBuffer();
  const originalName = file.name.replace(/\.pdf$/i, '');

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${originalName}_comprimido.pdf"`,
      'X-Original-Size': String(file.size),
      'X-Compressed-Size': String(buffer.byteLength),
    },
  });
}

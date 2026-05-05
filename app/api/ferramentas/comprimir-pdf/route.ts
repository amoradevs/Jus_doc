import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import CloudConvert from 'cloudconvert';

// Vercel Hobby cap: 10s — aumenta até onde permitir
export const maxDuration = 60;

export async function POST(req: Request) {
  await getCurrentUser();

  if (!process.env.PDF_CONVERTER_API_KEY) {
    return NextResponse.json(
      { error: 'Compressor indisponível: chave da API não configurada.' },
      { status: 503 },
    );
  }

  let file: File | null = null;
  try {
    const form = await req.formData();
    file = form.get('arquivo') as File | null;
  } catch {
    return NextResponse.json({ error: 'Erro ao ler o arquivo enviado.' }, { status: 400 });
  }

  if (!file) return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });

  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext !== 'pdf') {
    return NextResponse.json({ error: 'Apenas arquivos PDF são aceitos.' }, { status: 400 });
  }

  const MAX_MB = 20;
  if (file.size > MAX_MB * 1024 * 1024) {
    return NextResponse.json({ error: `Arquivo muito grande. Limite: ${MAX_MB} MB.` }, { status: 400 });
  }

  try {
    const client = new CloudConvert(process.env.PDF_CONVERTER_API_KEY!);

    // Usa convert PDF→PDF com ghostscript (mais confiável que optimize)
    const job = await client.jobs.create({
      tasks: {
        upload: { operation: 'import/upload' },
        convert: {
          operation: 'convert',
          input: ['upload'],
          input_format: 'pdf',
          output_format: 'pdf',
          engine: 'ghostscript',
        },
        export: {
          operation: 'export/url',
          input: ['convert'],
        },
      },
    });

    const uploadTask = job.tasks.find((t) => t.name === 'upload');
    if (!uploadTask) throw new Error('Upload task não encontrada.');

    const bytes = await file.arrayBuffer();
    await client.tasks.upload(uploadTask, new Blob([bytes]), file.name);

    const completed = await client.jobs.wait(job.id);

    const failed = completed.tasks.find((t) => t.status === 'error');
    if (failed) {
      throw new Error(failed.message ?? 'Falha no processamento CloudConvert.');
    }

    const exportTask = completed.tasks.find((t) => t.name === 'export');
    const fileUrl = exportTask?.result?.files?.[0]?.url;
    if (!fileUrl) throw new Error('URL de download não encontrada.');

    const compressed = await fetch(fileUrl);
    if (!compressed.ok) throw new Error('Falha ao baixar arquivo comprimido.');

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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido.';
    console.error('[comprimir-pdf]', message);
    return NextResponse.json({ error: `Erro ao comprimir: ${message}` }, { status: 500 });
  }
}

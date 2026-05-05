import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import CloudConvert from 'cloudconvert';

export async function POST() {
  await getCurrentUser();

  if (!process.env.PDF_CONVERTER_API_KEY) {
    return NextResponse.json({ error: 'Compressor indisponível: chave da API não configurada.' }, { status: 503 });
  }

  try {
    const client = new CloudConvert(process.env.PDF_CONVERTER_API_KEY!);

    const job = await client.jobs.create({
      tasks: {
        upload: { operation: 'import/upload' },
        optimize: {
          operation: 'optimize',
          input: ['upload'],
          input_format: 'pdf',
          output_format: 'pdf',
          profile: 'mrc',
        },
        export: {
          operation: 'export/url',
          input: ['optimize'],
        },
      },
    });

    const uploadTask = job.tasks.find((t) => t.name === 'upload');
    const form = (uploadTask as { result?: { form?: { url: string; parameters: Record<string, string> } } })?.result?.form;

    if (!form) throw new Error('Não foi possível obter URL de upload.');

    return NextResponse.json({ jobId: job.id, uploadUrl: form.url, uploadParams: form.parameters });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

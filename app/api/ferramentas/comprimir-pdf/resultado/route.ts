import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import CloudConvert from 'cloudconvert';

const MAX_OUTPUT_BYTES = 5 * 1024 * 1024;

export async function GET(req: Request) {
  await getCurrentUser();

  const jobId = new URL(req.url).searchParams.get('jobId');
  if (!jobId) return NextResponse.json({ error: 'jobId ausente.' }, { status: 400 });

  if (!process.env.PDF_CONVERTER_API_KEY) {
    return NextResponse.json({ error: 'API não configurada.' }, { status: 503 });
  }

  try {
    const client = new CloudConvert(process.env.PDF_CONVERTER_API_KEY!);
    const job = await client.jobs.get(jobId);

    if (job.status === 'error') {
      const failed = job.tasks.find((t) => t.status === 'error');
      return NextResponse.json({ error: failed?.message ?? 'Falha no processamento.' }, { status: 500 });
    }

    if (job.status !== 'finished') {
      return NextResponse.json({ status: job.status });
    }

    const exportTask = job.tasks.find((t) => t.name === 'export');
    const file = exportTask?.result?.files?.[0];

    if (!file?.url) return NextResponse.json({ error: 'URL de download não encontrada.' }, { status: 500 });

    const compressedSize: number = (file as { size?: number }).size ?? 0;

    if (compressedSize > MAX_OUTPUT_BYTES) {
      const sizeMB = (compressedSize / (1024 * 1024)).toFixed(1);
      return NextResponse.json(
        { error: `Mesmo após compressão máxima, o arquivo ficou com ${sizeMB} MB. Tente dividir o PDF em partes menores.` },
        { status: 422 },
      );
    }

    return NextResponse.json({ status: 'finished', downloadUrl: file.url, compressedSize });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

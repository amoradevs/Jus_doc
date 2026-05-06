import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { extractDocx } from '@/lib/template-wizard/docx-extractor';
import { suggestTags } from '@/lib/template-wizard/ai-tagger';

export const maxDuration = 30;

export async function POST(req: Request) {
  await getCurrentUser();

  let file: File | null = null;
  try {
    const form = await req.formData();
    file = form.get('arquivo') as File | null;
  } catch {
    return NextResponse.json({ error: 'Erro ao ler o arquivo.' }, { status: 400 });
  }

  if (!file) return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });

  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext !== 'docx') {
    return NextResponse.json({ error: 'Apenas arquivos .docx são aceitos pelo Wizard.' }, { status: 400 });
  }

  try {
    const buffer = await file.arrayBuffer();
    const { text } = await extractDocx(buffer);

    if (!text.trim()) {
      return NextResponse.json({ error: 'Não foi possível extrair texto do documento.' }, { status: 422 });
    }

    const suggestions = await suggestTags(text);
    return NextResponse.json({ suggestions, textPreview: text.slice(0, 3000) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

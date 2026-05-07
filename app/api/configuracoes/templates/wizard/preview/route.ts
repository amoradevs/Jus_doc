import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import mammoth from 'mammoth';

export async function POST(req: Request) {
  await getCurrentUser();
  const form = await req.formData();
  const file = form.get('arquivo') as File | null;
  if (!file) return NextResponse.json({ error: 'Arquivo obrigatório.' }, { status: 400 });
  const buffer = Buffer.from(await file.arrayBuffer());
  const { value: html } = await mammoth.convertToHtml({ buffer });
  return NextResponse.json({ html });
}

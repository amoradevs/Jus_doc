import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { buildDocumentPackage } from '@/lib/document-generation/package-builder';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  const { clientId, templateCodes, cenario } = await req.json();

  if (!clientId || !Array.isArray(templateCodes) || templateCodes.length === 0) {
    return NextResponse.json({ error: { code: 'INVALID_INPUT' } }, { status: 400 });
  }

  try {
    const result = await buildDocumentPackage(clientId, templateCodes, user.tenantId, cenario);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro interno';
    return NextResponse.json({ error: { code: 'GENERATION_FAILED', message: msg } }, { status: 500 });
  }
}

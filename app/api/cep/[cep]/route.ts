import { NextResponse } from 'next/server';

export async function GET(_req: Request, { params }: { params: Promise<{ cep: string }> }) {
  const { cep } = await params;
  const digits = cep.replace(/\D/g, '');
  if (digits.length !== 8) {
    return NextResponse.json({ error: 'CEP_INVALID' }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, { signal: controller.signal });
    clearTimeout(timeout);
    const data = await res.json();
    if (data.erro) return NextResponse.json({ error: 'CEP_NOT_FOUND' }, { status: 404 });
    return NextResponse.json({
      logradouro: data.logradouro,
      bairro: data.bairro,
      localidade: data.localidade,
      uf: data.uf,
    });
  } catch {
    clearTimeout(timeout);
    return NextResponse.json({ error: 'CEP_LOOKUP_FAILED' }, { status: 502 });
  }
}

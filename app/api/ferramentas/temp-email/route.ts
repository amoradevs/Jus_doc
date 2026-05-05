import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';

const BASE = 'https://api.mail.tm';

function randomStr(len = 8) {
  return Math.random().toString(36).slice(2, 2 + len);
}

export async function POST(req: Request) {
  await getCurrentUser();

  const body = await req.json();
  const { action, token, id } = body as { action: string; token?: string; id?: string };

  if (action === 'gerar') {
    // 1. Busca domínio disponível
    const domainsRes = await fetch(`${BASE}/domains`, { cache: 'no-store' });
    if (!domainsRes.ok) return NextResponse.json({ error: 'Serviço indisponível.' }, { status: 502 });
    const domainsData = await domainsRes.json();
    const domain: string = domainsData['hydra:member']?.[0]?.domain;
    if (!domain) return NextResponse.json({ error: 'Nenhum domínio disponível.' }, { status: 502 });

    // 2. Cria conta
    const address = `adv${randomStr(7)}@${domain}`;
    const password = randomStr(16);

    const accRes = await fetch(`${BASE}/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, password }),
      cache: 'no-store',
    });
    if (!accRes.ok) return NextResponse.json({ error: 'Erro ao criar endereço.' }, { status: 502 });

    // 3. Obtém token
    const tokenRes = await fetch(`${BASE}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, password }),
      cache: 'no-store',
    });
    if (!tokenRes.ok) return NextResponse.json({ error: 'Erro ao autenticar.' }, { status: 502 });
    const { token: jwt } = await tokenRes.json();

    return NextResponse.json({ address, token: jwt });
  }

  if (action === 'inbox') {
    if (!token) return NextResponse.json({ error: 'Token ausente.' }, { status: 400 });
    const res = await fetch(`${BASE}/messages?page=1`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return NextResponse.json({ error: 'Erro ao buscar mensagens.' }, { status: 502 });
    const data = await res.json();
    return NextResponse.json(data['hydra:member'] ?? []);
  }

  if (action === 'mensagem') {
    if (!token || !id) return NextResponse.json({ error: 'Parâmetros ausentes.' }, { status: 400 });
    const res = await fetch(`${BASE}/messages/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return NextResponse.json({ error: 'Erro ao buscar mensagem.' }, { status: 502 });
    return NextResponse.json(await res.json());
  }

  return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });
}

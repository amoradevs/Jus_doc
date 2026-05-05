import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';

const BASE = 'https://www.1secmail.com/api/v1/';

export async function GET(req: Request) {
  await getCurrentUser();

  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');
  const login = searchParams.get('login');
  const domain = searchParams.get('domain');
  const id = searchParams.get('id');

  if (!action || !login || !domain) {
    return NextResponse.json({ error: 'Parâmetros inválidos.' }, { status: 400 });
  }

  let url = `${BASE}?action=${action}&login=${encodeURIComponent(login)}&domain=${encodeURIComponent(domain)}`;
  if (id) url += `&id=${encodeURIComponent(id)}`;

  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) {
    return NextResponse.json({ error: 'Erro ao consultar caixa de entrada.' }, { status: 502 });
  }

  const data = await res.json();
  return NextResponse.json(data);
}

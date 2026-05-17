import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  const { password } = await req.json();
  if (!password) return NextResponse.json({ ok: false }, { status: 400 });

  const { data: rows } = await db
    .from('users')
    .select('senha_hash')
    .eq('id', user.id)
    .limit(1);

  const hash = rows?.[0]?.senha_hash;
  if (!hash) return NextResponse.json({ ok: false }, { status: 401 });

  const ok = await bcrypt.compare(String(password), String(hash));
  return NextResponse.json({ ok }, { status: ok ? 200 : 401 });
}

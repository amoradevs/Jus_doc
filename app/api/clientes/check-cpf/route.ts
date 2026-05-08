import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { unmaskCPF } from '@/lib/validators/cpf';

export async function GET(req: Request) {
  const user = await getCurrentUser();
  const { searchParams } = new URL(req.url);
  const cpfRaw = searchParams.get('cpf') ?? '';
  const cpf = unmaskCPF(cpfRaw);

  if (cpf.length !== 11) {
    return NextResponse.json({ exists: false });
  }

  const { data } = await db
    .from('clients')
    .select('id, nome_completo')
    .eq('cpf', cpf)
    .eq('tenant_id', user.tenantId)
    .is('deletado_em', null)
    .limit(1);

  if (data && data.length > 0) {
    return NextResponse.json({
      exists: true,
      id: data[0].id,
      nome: data[0].nome_completo,
    });
  }

  return NextResponse.json({ exists: false });
}

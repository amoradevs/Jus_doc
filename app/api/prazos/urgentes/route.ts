import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

function toIsoToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const CATEGORIA_PRIORITY: Record<string, number> = {
  administrativo_inss: 1,
  judicial: 2,
  comercial_interno: 3,
  evento: 4,
};

export async function GET() {
  try {
    const user = await getCurrentUser();
    const hoje = toIsoToday();
    const limite = addDays(hoje, 2);

    const { data, error } = await db
      .from('prazos')
      .select(`
        id,
        categoria,
        tipo,
        data_limite,
        dias_uteis,
        status,
        processo_id,
        processos!inner(
          id,
          numero_interno,
          clients(nome_completo)
        )
      `)
      .eq('tenant_id', user.tenantId)
      .eq('status', 'pendente')
      .lte('data_limite', limite)
      .order('data_limite', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    type PrazoUrgente = {
      id: string;
      categoria: string;
      tipo: string;
      data_limite: string;
      dias_uteis: boolean;
      status: string;
      processo_id: string;
      processos: {
        id: string;
        numero_interno: string;
        clients: { nome_completo: string } | null;
      };
    };

    const urgentes = ((data ?? []) as unknown as PrazoUrgente[])
      .sort((a, b) => {
        if (a.data_limite !== b.data_limite) return a.data_limite.localeCompare(b.data_limite);
        return (CATEGORIA_PRIORITY[a.categoria] ?? 9) - (CATEGORIA_PRIORITY[b.categoria] ?? 9);
      })
      .map((p) => ({
        id: p.id,
        categoria: p.categoria,
        tipo: p.tipo,
        data_limite: p.data_limite,
        numero_interno: p.processos.numero_interno,
        cliente_nome: p.processos.clients?.nome_completo ?? null,
      }));

    return NextResponse.json({ urgentes, total: urgentes.length });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

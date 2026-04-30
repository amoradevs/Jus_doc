import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth-helpers';
import { executarCalculoPrevidenciario } from '@/lib/motor-previdenciario';

const periodoSchema = z.object({
  inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  fim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  origem: z.enum(['RGPS', 'RPPS', 'facultativo']).optional(),
});

const salarioSchema = z.object({
  competencia: z.string().regex(/^\d{2}\/\d{4}$/, 'Competência inválida (MM/AAAA)'),
  valor: z.number().positive(),
});

const entradaSchema = z.object({
  dataNascimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  sexo: z.enum(['M', 'F']),
  der: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'DER inválida'),
  filiadoAntesDaReforma: z.boolean(),
  periodos: z.array(periodoSchema).min(1, 'Informe ao menos um período contributivo'),
  salarios: z.array(salarioSchema),
});

export async function POST(req: Request) {
  await getCurrentUser();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const parsed = entradaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', detalhes: parsed.error.flatten() }, { status: 422 });
  }

  try {
    const resultado = executarCalculoPrevidenciario(parsed.data);
    return NextResponse.json(resultado);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

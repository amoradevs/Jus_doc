import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { z } from 'zod';

const dependenteSchema = z.object({
  nome_completo: z.string().min(2),
  cpf: z.string().optional(),
  data_nascimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  relacao_com_instituidor: z.string().min(1),
  e_titular_no_sistema: z.boolean().default(false),
});

const bodySchema = z.object({
  instituidor: z.object({
    nome_completo: z.string().min(2),
    data_obito: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    qualidade_previdenciaria: z.string().min(1),
  }),
  dependentes: z.array(dependenteSchema).min(1),
  representacao_legal: z
    .object({
      representante_nome: z.string().min(2),
      representante_cpf: z.string().min(11),
      qualidade: z.string().min(1),
      beneficiarios_representados: z.array(z.object({ nome: z.string().min(2), cpf: z.string().optional() })).min(1),
    })
    .nullable(),
});

async function verificarProcesso(processoId: string, tenantId: string) {
  const { data } = await db
    .from('processos')
    .select('id, tipo_beneficio')
    .eq('id', processoId)
    .eq('tenant_id', tenantId)
    .is('archived_at', null)
    .limit(1);
  return data?.[0] ?? null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  const { id: processoId } = await params;

  const proc = await verificarProcesso(processoId, user.tenantId);
  if (!proc) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

  const [{ data: instituidores }, { data: dependentes }, { data: repLegal }] = await Promise.all([
    db.from('instituidores').select('*').eq('processo_id', processoId).is('archived_at', null).limit(1),
    db.from('dependentes_habilitados').select('*').eq('processo_id', processoId).is('archived_at', null).order('created_at'),
    db.from('representacoes_legais').select('*').eq('processo_id', processoId).is('archived_at', null).limit(1),
  ]);

  return NextResponse.json({
    instituidor: instituidores?.[0] ?? null,
    dependentes: dependentes ?? [],
    representacao_legal: repLegal?.[0] ?? null,
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  const { id: processoId } = await params;

  const proc = await verificarProcesso(processoId, user.tenantId);
  if (!proc) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  if (proc.tipo_beneficio !== 'pensao_morte') {
    return NextResponse.json({ error: 'Processo não é pensão por morte' }, { status: 400 });
  }

  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
      { status: 400 },
    );
  }

  const { instituidor, dependentes, representacao_legal } = parsed.data;

  // Upsert instituidor (delete + insert para simplicidade)
  await db.from('instituidores').update({ archived_at: new Date().toISOString() }).eq('processo_id', processoId).is('archived_at', null);
  const { error: errInst } = await db.from('instituidores').insert({
    tenant_id: user.tenantId,
    processo_id: processoId,
    nome_completo: instituidor.nome_completo,
    data_obito: instituidor.data_obito,
    qualidade_previdenciaria: instituidor.qualidade_previdenciaria,
  });
  if (errInst) return NextResponse.json({ error: errInst.message }, { status: 500 });

  // Substituir dependentes
  await db.from('dependentes_habilitados').update({ archived_at: new Date().toISOString() }).eq('processo_id', processoId).is('archived_at', null);
  const { error: errDep } = await db.from('dependentes_habilitados').insert(
    dependentes.map((d) => ({
      tenant_id: user.tenantId,
      processo_id: processoId,
      nome_completo: d.nome_completo,
      cpf: d.cpf || null,
      data_nascimento: d.data_nascimento,
      relacao_com_instituidor: d.relacao_com_instituidor,
      e_titular_no_sistema: d.e_titular_no_sistema,
    })),
  );
  if (errDep) return NextResponse.json({ error: errDep.message }, { status: 500 });

  // Upsert representação legal
  await db.from('representacoes_legais').update({ archived_at: new Date().toISOString() }).eq('processo_id', processoId).is('archived_at', null);
  if (representacao_legal) {
    const { error: errRep } = await db.from('representacoes_legais').insert({
      tenant_id: user.tenantId,
      processo_id: processoId,
      representante_nome: representacao_legal.representante_nome,
      representante_cpf: representacao_legal.representante_cpf.replace(/\D/g, ''),
      qualidade: representacao_legal.qualidade,
      beneficiarios_representados: representacao_legal.beneficiarios_representados,
    });
    if (errRep) return NextResponse.json({ error: errRep.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

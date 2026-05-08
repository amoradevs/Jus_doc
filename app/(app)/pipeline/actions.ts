'use server';

import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { checklistPadrao } from '@/lib/pipeline';

// ── Kanban: mover processo entre etapas ─────────────────────────────

export async function moverEtapa(processoId: string, novaEtapa: string) {
  const user = await getCurrentUser();

  await db
    .from('processos')
    .update({
      etapa_pipeline: novaEtapa,
      updated_at: new Date().toISOString(),
    })
    .eq('id', processoId)
    .eq('tenant_id', user.tenantId);

  revalidatePath('/pipeline');
  revalidatePath('/');
}

export async function atualizarObservacao(processoId: string, observacao: string) {
  const user = await getCurrentUser();

  await db
    .from('processos')
    .update({
      observacao_pipeline: observacao,
      updated_at: new Date().toISOString(),
    })
    .eq('id', processoId)
    .eq('tenant_id', user.tenantId);

  revalidatePath('/pipeline');
}

// ── Checklist de documentos ─────────────────────────────────────────

export async function inicializarChecklist(clientId: string, tipoBeneficio: string | null) {
  const user = await getCurrentUser();

  const { count } = await db
    .from('case_documents')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .eq('tenant_id', user.tenantId);

  if ((count ?? 0) > 0) return;

  const docs = checklistPadrao(tipoBeneficio);

  const inserts = docs.map((d) => ({
    tenant_id: user.tenantId,
    client_id: clientId,
    nome: d.nome,
    categoria: d.categoria,
    obrigatorio: d.obrigatorio,
    recebido: false,
  }));

  await db.from('case_documents').insert(inserts);
  revalidatePath(`/clientes/${clientId}`);
}

export async function toggleDocumento(docId: string, recebido: boolean, clientId: string) {
  const user = await getCurrentUser();

  await db
    .from('case_documents')
    .update({
      recebido,
      recebido_em: recebido ? new Date().toISOString() : null,
    })
    .eq('id', docId)
    .eq('tenant_id', user.tenantId);

  revalidatePath('/pipeline');
  revalidatePath(`/clientes/${clientId}`);
}

export async function adicionarDocumento(
  clientId: string,
  nome: string,
  categoria: string,
  obrigatorio: boolean
) {
  const user = await getCurrentUser();

  await db.from('case_documents').insert({
    tenant_id: user.tenantId,
    client_id: clientId,
    nome,
    categoria,
    obrigatorio,
    recebido: false,
  });

  revalidatePath(`/clientes/${clientId}`);
}

export async function removerDocumento(docId: string, clientId: string) {
  const user = await getCurrentUser();

  await db
    .from('case_documents')
    .delete()
    .eq('id', docId)
    .eq('tenant_id', user.tenantId);

  revalidatePath('/pipeline');
  revalidatePath(`/clientes/${clientId}`);
}

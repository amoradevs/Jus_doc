'use server';

import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { checklistPadrao } from '@/lib/pipeline';

// ── Kanban: mover cliente entre etapas ──────────────────────────────

export async function moverEtapa(clientId: string, novaEtapa: string) {
  const user = await getCurrentUser();

  await db
    .from('clients')
    .update({
      etapa_pipeline: novaEtapa,
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', clientId)
    .eq('tenant_id', user.tenantId);

  revalidatePath('/pipeline');
  revalidatePath(`/clientes/${clientId}`);
  revalidatePath('/');
}

export async function atualizarObservacao(clientId: string, observacao: string) {
  const user = await getCurrentUser();

  await db
    .from('clients')
    .update({
      observacao_pipeline: observacao,
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', clientId)
    .eq('tenant_id', user.tenantId);

  revalidatePath('/pipeline');
  revalidatePath(`/clientes/${clientId}`);
}

// ── Checklist de documentos ─────────────────────────────────────────

export async function inicializarChecklist(clientId: string, tipoPedido: string | null) {
  const user = await getCurrentUser();

  // Verificar se já tem documentos cadastrados
  const { count } = await db
    .from('case_documents')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .eq('tenant_id', user.tenantId);

  if ((count ?? 0) > 0) return; // já inicializado

  const docs = checklistPadrao(tipoPedido);

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

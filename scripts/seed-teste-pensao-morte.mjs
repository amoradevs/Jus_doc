/**
 * Seed de teste para Pensão por Morte — P3
 * Execute NO TERMINAL onde as variáveis de ambiente estão disponíveis:
 *   node scripts/seed-teste-pensao-morte.mjs
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
);

async function main() {
  // 1. Buscar tenant
  const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
  if (!tenants?.length) throw new Error('Nenhum tenant encontrado');
  const tenantId = tenants[0].id;
  console.log('Tenant:', tenantId);

  // 2. Criar cliente de teste
  const { data: cliente, error: errCliente } = await supabase
    .from('clients')
    .insert({
      tenant_id:          tenantId,
      nome_completo:      'SEBASTIANA MARTA GOMES DE SOUSA GENEROSO',
      cpf:                '01358869880',
      data_nascimento:    '1965-03-10',
      genero:             'F',
      estado_civil:       'viuvo',
      nacionalidade:      'brasileiro',
      nome_mae:           'Maria Gomes de Sousa',
      sabe_assinar:       true,
      endereco_logradouro:'Rua Antônio Custódio',
      endereco_numero:    '342',
      endereco_bairro:    'Parangaba',
      endereco_cidade:    'Fortaleza',
      endereco_uf:        'CE',
      endereco_cep:       '60720000',
      telefone:           '(85) 99801-2233',
    })
    .select('id, nome_completo')
    .single();

  if (errCliente) {
    // Tenta buscar se já existe
    const { data: existente } = await supabase
      .from('clients')
      .select('id, nome_completo')
      .eq('cpf', '01358869880')
      .eq('tenant_id', tenantId)
      .limit(1);
    if (!existente?.length) throw new Error(`Erro ao criar cliente: ${errCliente.message}`);
    console.log('Cliente já existe:', existente[0].nome_completo, '—', existente[0].id);
    await criarProcesso(supabase, tenantId, existente[0].id);
    return;
  }

  console.log('✓ Cliente criado:', cliente.nome_completo, '—', cliente.id);
  await criarProcesso(supabase, tenantId, cliente.id);
}

async function criarProcesso(supabase, tenantId, clienteId) {
  // 3. Criar processo de pensão por morte
  const { data: processo, error: errProc } = await supabase
    .from('processos')
    .insert({
      tenant_id:      tenantId,
      cliente_id:     clienteId,
      tipo_beneficio: 'pensao_morte',
      etapa_pipeline: 'documentos',
      status_resultado: 'em_andamento',
    })
    .select('id, numero_interno')
    .single();

  if (errProc) throw new Error(`Erro ao criar processo: ${errProc.message}`);
  console.log('✓ Processo criado:', processo.numero_interno, '—', processo.id);
  console.log('\n─────────────────────────────────────────────────');
  console.log('Acesse: http://localhost:3000/processos/' + processo.numero_interno);
  console.log('─────────────────────────────────────────────────\n');
  console.log('O processo de Pensão por Morte está pronto para teste.');
  console.log('A seção "Dados da Pensão por Morte" aparecerá no Resumo.');
}

main().catch(console.error);

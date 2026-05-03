import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const TEMPLATES = [
  { codigo: '01', nome: 'Contrato BPC — Adulto Pleno',          familia: 'contrato',   formato: 'docx', caminho_arquivo: 'templates/01_contrato_bpc_adulto.docx',              campos_contextuais_necessarios: [] },
  { codigo: '02', nome: 'Contrato BPC — A Rogo',                familia: 'contrato',   formato: 'docx', caminho_arquivo: 'templates/02_contrato_bpc_a_rogo.docx',              campos_contextuais_necessarios: ['testemunhas'] },
  { codigo: '03', nome: 'Contrato BPC — Menor (< 16 anos)',     familia: 'contrato',   formato: 'docx', caminho_arquivo: 'templates/03_contrato_bpc_menor_16.docx',            campos_contextuais_necessarios: ['representante_legal'] },
  { codigo: '04', nome: 'Contrato BPC — Menor (16 a 18 anos)', familia: 'contrato',   formato: 'docx', caminho_arquivo: 'templates/04_contrato_bpc_menor_16_a_18.docx',       campos_contextuais_necessarios: ['representante_legal'] },
  { codigo: '05', nome: 'Procuração BPC — Adulto Pleno',       familia: 'procuracao', formato: 'docx', caminho_arquivo: 'templates/05_procuracao_bpc_adulto.docx',            campos_contextuais_necessarios: [] },
  { codigo: '06', nome: 'Procuração BPC — Menor (< 16 anos)',  familia: 'procuracao', formato: 'docx', caminho_arquivo: 'templates/06_procuracao_bpc_menor_16.docx',          campos_contextuais_necessarios: ['representante_legal'] },
  { codigo: '07', nome: 'Procuração BPC — (16 a 18 anos)',     familia: 'procuracao', formato: 'docx', caminho_arquivo: 'templates/07_procuracao_bpc_16_a_18.docx',           campos_contextuais_necessarios: ['representante_legal'] },
  { codigo: '08', nome: 'Procuração — Mandado de Segurança',   familia: 'procuracao', formato: 'docx', caminho_arquivo: 'templates/08_procuracao_mandado_seguranca.docx',     campos_contextuais_necessarios: [] },
  { codigo: '09', nome: 'Declaração de Hipossuficiência',      familia: 'declaracao', formato: 'docx', caminho_arquivo: 'templates/09_declaracao_hipossuficiencia.docx',      campos_contextuais_necessarios: [] },
  { codigo: '10', nome: 'Declaração de Residência',            familia: 'declaracao', formato: 'docx', caminho_arquivo: 'templates/10_declaracao_residencia.docx',            campos_contextuais_necessarios: ['filho_dependente', 'imovel'] },
  { codigo: '11', nome: 'Declaração de Separação',             familia: 'declaracao', formato: 'docx', caminho_arquivo: 'templates/11_declaracao_separacao.docx',             campos_contextuais_necessarios: ['conjuge'] },
  { codigo: '12', nome: 'Declaração de Inatividade MEI',       familia: 'declaracao', formato: 'docx', caminho_arquivo: 'templates/12_declaracao_inatividade_mei.docx',       campos_contextuais_necessarios: ['empresa_mei'] },
  { codigo: '13', nome: 'Declaração de Separação de Fato (INSS)', familia: 'declaracao', formato: 'pdf', caminho_arquivo: 'templates/13_declaracao_separacao_fato_inss.pdf', campos_contextuais_necessarios: ['conjuge'] },
  { codigo: '14', nome: 'Termo de Representação (INSS)',       familia: 'termo',      formato: 'pdf', caminho_arquivo: 'templates/14_termo_representacao_inss.pdf',           campos_contextuais_necessarios: [] },
  { codigo: '15', nome: 'Termo de Responsabilidade (INSS)',    familia: 'termo',      formato: 'pdf', caminho_arquivo: 'templates/15_termo_responsabilidade_inss.pdf',        campos_contextuais_necessarios: [] },
];

async function main() {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
  console.log('Iniciando seed...');

  const { data: tenant, error: tenantErr } = await supabase
    .from('tenants')
    .insert({ nome: 'Escritório Lidiane & Alcione' })
    .select('id')
    .single();

  if (tenantErr || !tenant) throw new Error(`Erro ao criar tenant: ${tenantErr?.message}`);

  const senhaHash = await bcrypt.hash('admin123', 12);
  await supabase.from('users').insert({
    tenant_id: tenant.id,
    email: 'gestao@escritorio.com',
    senha_hash: senhaHash,
    nome: 'Lidiane Rocha Abreu',
  });

  await supabase.from('office_settings').insert({ tenant_id: tenant.id });

  await supabase.from('document_templates').insert(
    TEMPLATES.map((t) => ({ ...t, campos_contextuais_necessarios: t.campos_contextuais_necessarios }))
  );

  console.log('Seed concluído. 1 tenant, 1 usuário, 15 templates inseridos.');
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });

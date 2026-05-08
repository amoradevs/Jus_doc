import {
  pgTable,
  uuid,
  text,
  timestamp,
  date,
  jsonb,
  unique,
  boolean,
  index,
} from 'drizzle-orm/pg-core';

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  nome: text('nome').notNull(),
  criado_em: timestamp('criado_em').notNull().defaultNow(),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id),
  email: text('email').notNull().unique(),
  senha_hash: text('senha_hash').notNull(),
  nome: text('nome').notNull(),
  criado_em: timestamp('criado_em').notNull().defaultNow(),
});

export const office_settings = pgTable('office_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id),
  advogada_principal_nome: text('advogada_principal_nome').notNull().default(''),
  advogada_principal_nome_curto: text('advogada_principal_nome_curto').notNull().default(''),
  advogada_principal_oab: text('advogada_principal_oab').notNull().default(''),
  advogada_principal_email: text('advogada_principal_email').notNull().default(''),
  advogada_parceira_nome: text('advogada_parceira_nome').notNull().default(''),
  advogada_parceira_nome_curto: text('advogada_parceira_nome_curto').notNull().default(''),
  advogada_parceira_oab: text('advogada_parceira_oab').notNull().default(''),
  advogada_parceira_email: text('advogada_parceira_email').notNull().default(''),
  endereco_logradouro: text('endereco_logradouro').notNull().default(''),
  endereco_numero: text('endereco_numero').notNull().default(''),
  endereco_complemento: text('endereco_complemento'),
  endereco_bairro: text('endereco_bairro').notNull().default(''),
  endereco_cidade: text('endereco_cidade').notNull().default(''),
  endereco_uf: text('endereco_uf').notNull().default(''),
  endereco_cep: text('endereco_cep').notNull().default(''),
});

export const clients = pgTable('clients', {
  // ── Identidade ─────────────────────────────────────────────────────
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id),

  // ── Dados de pessoa (permanecem em clients) ────────────────────────
  nome_completo: text('nome_completo').notNull(),
  nacionalidade: text('nacionalidade').notNull().default('brasileiro'),
  genero: text('genero', { enum: ['M', 'F'] }).notNull(),
  estado_civil: text('estado_civil').notNull(),
  data_nascimento: date('data_nascimento').notNull(),
  cpf: text('cpf').notNull(),
  rg: text('rg').notNull(),
  rg_orgao_emissor: text('rg_orgao_emissor').notNull(),
  nome_mae: text('nome_mae').notNull(),
  nome_pai: text('nome_pai'),
  telefone: text('telefone'),
  senha_cadastro: text('senha_cadastro'),
  sabe_assinar: boolean('sabe_assinar').notNull().default(true),
  nit: text('nit'),

  // ── Endereço ───────────────────────────────────────────────────────
  endereco_logradouro: text('endereco_logradouro').notNull(),
  endereco_numero: text('endereco_numero').notNull(),
  endereco_complemento: text('endereco_complemento'),
  endereco_bairro: text('endereco_bairro').notNull(),
  endereco_cidade: text('endereco_cidade').notNull(),
  endereco_uf: text('endereco_uf').notNull(),
  endereco_cep: text('endereco_cep').notNull(),

  // ── Auditoria ──────────────────────────────────────────────────────
  criado_em: timestamp('criado_em').notNull().defaultNow(),
  atualizado_em: timestamp('atualizado_em').notNull().defaultNow(),
  deletado_em: timestamp('deletado_em'),
}, (t) => ({
  cpf_tenant_unique: unique().on(t.cpf, t.tenant_id),
}));

// ── processos ──────────────────────────────────────────────────────────────
// Entidade-caso: vinculada a um cliente, com seus próprios atributos.
// Um cliente pode ter zero, um ou múltiplos processos.
// Migration 011 — Bloco A.

export const TIPO_BENEFICIO_VALUES = [
  'aposentadoria_idade_urbana',
  'aposentadoria_idade_rural',
  'aposentadoria_tempo_contribuicao',
  'bpc_idoso',
  'bpc_deficiente_adulto',
  'bpc_deficiente_menor_16',
  'bpc_deficiente_16_18',
  'mandado_seguranca',
  'pensao_morte',
  'auxilio_doenca',
] as const;

export type TipoBeneficio = (typeof TIPO_BENEFICIO_VALUES)[number];

export const ETAPA_PIPELINE_VALUES = [
  'triagem', 'consulta', 'documentos', 'aguardando_inss',
  'pericia', 'judicial', 'concedido', 'encerrado',
] as const;

export type EtapaPipelineProcesso = (typeof ETAPA_PIPELINE_VALUES)[number];

export const STATUS_RESULTADO_VALUES = [
  'em_andamento', 'exigencia', 'deferido', 'indeferido',
  'recurso_administrativo', 'judicializado', 'arquivado',
] as const;

export type StatusResultado = (typeof STATUS_RESULTADO_VALUES)[number];

export const processos = pgTable('processos', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id),
  cliente_id: uuid('cliente_id').notNull().references(() => clients.id),

  numero_interno: text('numero_interno').notNull().unique(),

  tipo_beneficio: text('tipo_beneficio', { enum: TIPO_BENEFICIO_VALUES }),

  etapa_pipeline: text('etapa_pipeline', { enum: ETAPA_PIPELINE_VALUES })
    .notNull()
    .default('triagem'),

  status_resultado: text('status_resultado', { enum: STATUS_RESULTADO_VALUES })
    .notNull()
    .default('em_andamento'),

  numero_protocolo_inss: text('numero_protocolo_inss'),
  numero_processo_judicial: text('numero_processo_judicial'),

  data_entrada: date('data_entrada'),
  dib_pleiteada: date('dib_pleiteada'),

  // Campos transitórios de agenda (migrados de clients; substituídos por prazos no Bloco B)
  observacao_pipeline: text('observacao_pipeline'),
  data_proxima_audiencia: date('data_proxima_audiencia'),
  data_prazo: date('data_prazo'),
  tipo_evento: text('tipo_evento', {
    enum: ['audiencia', 'pericia', 'consulta', 'prazo', 'outro'],
  }),
  descricao_evento: text('descricao_evento'),

  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
}, (t) => ({
  idx_cliente: index('idx_processos_cliente_id').on(t.cliente_id),
  idx_tenant: index('idx_processos_tenant_id').on(t.tenant_id),
  idx_etapa: index('idx_processos_etapa').on(t.etapa_pipeline),
  idx_status: index('idx_processos_status').on(t.status_resultado),
}));

export const client_contextual_data = pgTable('client_contextual_data', {
  id: uuid('id').primaryKey().defaultRandom(),
  client_id: uuid('client_id').notNull().unique().references(() => clients.id),
  representante_legal: jsonb('representante_legal'),
  conjuge: jsonb('conjuge'),
  filho_dependente: jsonb('filho_dependente'),
  empresa_mei: jsonb('empresa_mei'),
  imovel: jsonb('imovel'),
});

export const document_templates = pgTable('document_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  codigo: text('codigo').notNull().unique(),
  nome: text('nome').notNull(),
  familia: text('familia', { enum: ['contrato', 'procuracao', 'declaracao', 'termo'] }).notNull(),
  formato: text('formato', { enum: ['docx', 'pdf'] }).notNull(),
  caminho_arquivo: text('caminho_arquivo').notNull(),
  campos_contextuais_necessarios: jsonb('campos_contextuais_necessarios').notNull().default([]),
  versao: text('versao').notNull().default('1'),
  ativo: text('ativo').notNull().default('true'),
});

export const generation_packages = pgTable('generation_packages', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id),
  client_id: uuid('client_id').notNull().references(() => clients.id),
  templates_usados: jsonb('templates_usados').notNull(),
  zip_storage_path: text('zip_storage_path'),
  criado_em: timestamp('criado_em').notNull().defaultNow(),
  expira_em: timestamp('expira_em').notNull(),
});

export const generated_documents = pgTable('generated_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  package_id: uuid('package_id').notNull().references(() => generation_packages.id),
  template_codigo: text('template_codigo').notNull(),
  nome_arquivo: text('nome_arquivo').notNull(),
  storage_path: text('storage_path').notNull(),
});

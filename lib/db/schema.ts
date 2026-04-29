import {
  pgTable,
  uuid,
  text,
  timestamp,
  date,
  jsonb,
  unique,
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
  id: uuid('id').primaryKey().defaultRandom(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id),
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
  endereco_logradouro: text('endereco_logradouro').notNull(),
  endereco_numero: text('endereco_numero').notNull(),
  endereco_complemento: text('endereco_complemento'),
  endereco_bairro: text('endereco_bairro').notNull(),
  endereco_cidade: text('endereco_cidade').notNull(),
  endereco_uf: text('endereco_uf').notNull(),
  endereco_cep: text('endereco_cep').notNull(),
  criado_em: timestamp('criado_em').notNull().defaultNow(),
  atualizado_em: timestamp('atualizado_em').notNull().defaultNow(),
  deletado_em: timestamp('deletado_em'),
}, (t) => ({
  cpf_tenant_unique: unique().on(t.cpf, t.tenant_id),
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

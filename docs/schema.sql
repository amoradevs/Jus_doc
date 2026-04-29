-- JusDoc — Criação de tabelas
-- Executar no SQL Editor do Supabase: https://supabase.com/dashboard/project/oemumlmszlklpbgkwhbs/editor

create extension if not exists "uuid-ossp";

create table if not exists tenants (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  criado_em timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  email text not null unique,
  senha_hash text not null,
  nome text not null,
  criado_em timestamptz not null default now()
);

create table if not exists office_settings (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  advogada_principal_nome text not null default '',
  advogada_principal_nome_curto text not null default '',
  advogada_principal_oab text not null default '',
  advogada_principal_email text not null default '',
  advogada_parceira_nome text not null default '',
  advogada_parceira_nome_curto text not null default '',
  advogada_parceira_oab text not null default '',
  advogada_parceira_email text not null default '',
  endereco_logradouro text not null default '',
  endereco_numero text not null default '',
  endereco_complemento text,
  endereco_bairro text not null default '',
  endereco_cidade text not null default '',
  endereco_uf text not null default '',
  endereco_cep text not null default ''
);

create table if not exists clients (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  nome_completo text not null,
  nacionalidade text not null default 'brasileiro',
  genero text not null check (genero in ('M', 'F')),
  estado_civil text not null,
  data_nascimento date not null,
  cpf text not null,
  rg text not null,
  rg_orgao_emissor text not null,
  nome_mae text not null,
  nome_pai text,
  endereco_logradouro text not null,
  endereco_numero text not null,
  endereco_complemento text,
  endereco_bairro text not null,
  endereco_cidade text not null,
  endereco_uf text not null,
  endereco_cep text not null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  deletado_em timestamptz,
  unique(cpf, tenant_id)
);

create table if not exists client_contextual_data (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null unique references clients(id),
  representante_legal jsonb,
  conjuge jsonb,
  filho_dependente jsonb,
  empresa_mei jsonb,
  imovel jsonb
);

create table if not exists document_templates (
  id uuid primary key default uuid_generate_v4(),
  codigo text not null unique,
  nome text not null,
  familia text not null check (familia in ('contrato', 'procuracao', 'declaracao', 'termo')),
  formato text not null check (formato in ('docx', 'pdf')),
  caminho_arquivo text not null,
  campos_contextuais_necessarios jsonb not null default '[]',
  versao text not null default '1',
  ativo text not null default 'true'
);

create table if not exists generation_packages (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  client_id uuid not null references clients(id),
  templates_usados jsonb not null,
  zip_storage_path text,
  criado_em timestamptz not null default now(),
  expira_em timestamptz not null
);

create table if not exists generated_documents (
  id uuid primary key default uuid_generate_v4(),
  package_id uuid not null references generation_packages(id),
  template_codigo text not null,
  nome_arquivo text not null,
  storage_path text not null
);

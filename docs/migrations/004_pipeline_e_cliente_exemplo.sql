-- JusDoc — Pipeline + cliente de exemplo
-- Executar no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/oemumlmszlklpbgkwhbs/editor

-- ── 1. Colunas de pipeline na tabela clients ────────────────────────

do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'clients' and column_name = 'etapa_pipeline'
  ) then
    alter table clients
      add column etapa_pipeline text not null default 'triagem'
        check (etapa_pipeline in (
          'triagem','consulta','documentos','aguardando_inss',
          'pericia','judicial','concedido','encerrado'
        ));
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'clients' and column_name = 'observacao_pipeline'
  ) then
    alter table clients add column observacao_pipeline text;
  end if;
end $$;

-- ── 2. Tabela de checklist de documentos ───────────────────────────

create table if not exists case_documents (
  id            uuid primary key default uuid_generate_v4(),
  tenant_id     uuid not null references tenants(id),
  client_id     uuid not null references clients(id) on delete cascade,
  nome          text not null,
  categoria     text not null default 'geral'
    check (categoria in ('geral','identificacao','renda','medico','familia','inss')),
  obrigatorio   boolean not null default true,
  recebido      boolean not null default false,
  recebido_em   timestamptz,
  observacao    text,
  criado_em     timestamptz not null default now()
);

create index if not exists idx_case_documents_client on case_documents(client_id);

-- ── 3. Cliente de exemplo para testar o Kanban ─────────────────────

insert into clients (
  tenant_id,
  nome_completo, nacionalidade, genero, estado_civil,
  data_nascimento, cpf, rg, rg_orgao_emissor,
  nome_mae,
  endereco_logradouro, endereco_numero, endereco_bairro,
  endereco_cidade, endereco_uf, endereco_cep,
  tipo_pedido, etapa_pipeline
)
values (
  '00000000-0000-0000-0000-000000000001',
  'Maria das Graças Silva', 'brasileira', 'F', 'solteira',
  '1965-03-14', '123.456.789-00', '12345678', 'SSP/SP',
  'Josefa Aparecida Silva',
  'Rua das Flores', '42', 'Jardim Paulista',
  'São Paulo', 'SP', '01310-100',
  'bpc_loas', 'triagem'
)
on conflict do nothing;

-- JusDoc — Checklist de documentos pendentes por cliente
-- Executar no SQL Editor do Supabase

-- Tabela de documentos pendentes do cliente
create table if not exists case_documents (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id),
  client_id uuid not null references clients(id) on delete cascade,
  nome text not null,                          -- Ex: "Laudo médico", "CadÚnico atualizado"
  categoria text not null default 'geral'      -- geral | identificacao | renda | medico | familia | inss
    check (categoria in ('geral','identificacao','renda','medico','familia','inss')),
  obrigatorio boolean not null default true,
  recebido boolean not null default false,
  recebido_em timestamptz,
  observacao text,
  criado_em timestamptz not null default now()
);

-- Índice para queries por cliente
create index if not exists idx_case_documents_client on case_documents(client_id);

-- Adicionar coluna de etapa do pipeline nos clientes (se não existir)
-- As etapas são: triagem | consulta | documentos | aguardando_inss | pericia | judicial | concedido | encerrado
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'clients' and column_name = 'etapa_pipeline'
  ) then
    alter table clients add column etapa_pipeline text not null default 'triagem'
      check (etapa_pipeline in (
        'triagem','consulta','documentos','aguardando_inss',
        'pericia','judicial','concedido','encerrado'
      ));
  end if;
end $$;

-- Adicionar coluna de observações rápidas (anotação do último acompanhamento)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'clients' and column_name = 'observacao_pipeline'
  ) then
    alter table clients add column observacao_pipeline text;
  end if;
end $$;

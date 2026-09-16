-- Corrige constraint de unicidade de CPF em clients para valer apenas entre
-- clientes ativos (não excluídos). Sem isso, o CPF de um cliente excluído
-- (soft delete via deletado_em) fica "preso" para sempre e bloqueia o
-- recadastro do mesmo CPF (ex.: excluir um cadastro com erro de digitação e
-- tentar cadastrar de novo).
-- Executar no SQL Editor do Supabase:

-- Remove a constraint antiga (localiza dinamicamente pelo nome real da
-- constraint, em vez de assumir o nome padrão gerado pelo Postgres).
do $$
declare
  v_constraint_name text;
begin
  select tc.constraint_name into v_constraint_name
  from information_schema.table_constraints tc
  join information_schema.key_column_usage kcu
    on tc.constraint_name = kcu.constraint_name
   and tc.table_schema = kcu.table_schema
  where tc.table_name = 'clients'
    and tc.constraint_type = 'UNIQUE'
    and tc.table_schema = 'public'
  group by tc.constraint_name
  having array_agg(kcu.column_name::text order by kcu.column_name::text) = array['cpf', 'tenant_id'];

  if v_constraint_name is not null then
    execute format('alter table clients drop constraint %I', v_constraint_name);
  end if;
end $$;

-- Cria índice único parcial: CPF só precisa ser único entre clientes ativos.
create unique index if not exists clients_cpf_tenant_ativos_idx
  on clients (cpf, tenant_id)
  where deletado_em is null;

-- Migration 020: adiciona colunas testemunhas, validador e separacao
-- à tabela client_contextual_data

alter table client_contextual_data
  add column if not exists testemunhas jsonb,
  add column if not exists validador   jsonb,
  add column if not exists separacao   jsonb;

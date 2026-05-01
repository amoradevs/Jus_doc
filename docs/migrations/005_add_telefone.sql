-- JusDoc — Adiciona campo de telefone/WhatsApp aos clientes
-- Executar no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/oemumlmszlklpbgkwhbs/editor

alter table clients
  add column if not exists telefone text;

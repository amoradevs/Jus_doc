-- Migração 001 — Campos de pedido BPC na tabela clients
-- Executar no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/oemumlmszlklpbgkwhbs/editor

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS data_entrada_pedido date,
  ADD COLUMN IF NOT EXISTS status_pedido text CHECK (status_pedido IN ('deferido', 'indeferido'));

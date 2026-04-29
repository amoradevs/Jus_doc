-- Migração 002 — Tipo de benefício/processo
-- Executar no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/oemumlmszlklpbgkwhbs/editor

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS tipo_pedido text;

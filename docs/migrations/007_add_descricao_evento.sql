-- Migração 007 — Descrição livre para tipo_evento = 'outro'
-- Executar no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/oemumlmszlklpbgkwhbs/editor

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS descricao_evento text;

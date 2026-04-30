-- Migração 006 — Campos de agenda por cliente
-- Executar no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/oemumlmszlklpbgkwhbs/editor

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS data_proxima_audiencia date,
  ADD COLUMN IF NOT EXISTS data_prazo             date,
  ADD COLUMN IF NOT EXISTS tipo_evento            text
    CHECK (tipo_evento IN ('audiencia', 'pericia', 'consulta', 'prazo', 'outro'));

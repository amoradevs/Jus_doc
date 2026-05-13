-- Migration: 009_rg_opcional.sql
-- Torna rg e rg_orgao_emissor opcionais na tabela clients.
-- Execute no SQL Editor do Supabase.

-- ── UP ───────────────────────────────────────────────────────────
ALTER TABLE clients ALTER COLUMN rg DROP NOT NULL;
ALTER TABLE clients ALTER COLUMN rg_orgao_emissor DROP NOT NULL;

-- ── DOWN (rollback) ──────────────────────────────────────────────
-- ATENÇÃO: só funciona se não houver linhas com rg NULL.
-- Se houver, preencha antes:
--   UPDATE clients SET rg = '' WHERE rg IS NULL;
--   UPDATE clients SET rg_orgao_emissor = '' WHERE rg_orgao_emissor IS NULL;
-- Depois:
--   ALTER TABLE clients ALTER COLUMN rg SET NOT NULL;
--   ALTER TABLE clients ALTER COLUMN rg_orgao_emissor SET NOT NULL;

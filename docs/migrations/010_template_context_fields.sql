-- JusDoc — Migração 010: Campos para contexto de templates docxtemplater
-- Executar no SQL Editor do Supabase: https://supabase.com/dashboard/project/oemumlmszlklpbgkwhbs/editor

-- ── clients: campos adicionais ─────────────────────────────────────────────

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS sabe_assinar boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS nit text;

-- sabe_assinar: se false, o contrato exige assinatura a rogo (2 testemunhas)
-- nit: número de identificação do trabalhador (PIS/PASEP)

-- ── office_settings: campos adicionais ────────────────────────────────────

ALTER TABLE office_settings
  ADD COLUMN IF NOT EXISTS advogada_parceira_cpf text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS foro_eleito text NOT NULL DEFAULT '';

-- advogada_parceira_cpf: CPF da advogada parceira (usado em alguns termos)
-- foro_eleito: ex: 'foro Regional de Pinheiros, Comarca da Capital (SP)'

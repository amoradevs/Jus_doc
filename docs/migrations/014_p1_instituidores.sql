-- ════════════════════════════════════════════════════════════════════════════
-- Migration 014 — Frente 3 P1: Tabela instituidores
-- Projeto: JusDoc — Rocha & Alencar Advocacia
-- Data: 2026-05-15
--
-- UP: Cria tabela `instituidores` (pessoa falecida cuja morte gera a pensão).
--     Um instituidor pertence a um processo de pensão por morte.
--     Soft delete via archived_at/archived_by/archive_reason.
--     ON DELETE RESTRICT: hard delete de processo é rejeitado pelo banco.
--
-- DOWN: Remove tabela.
--
-- VALIDAÇÃO (executar APÓS o UP):
--   \d instituidores                               -- confirmar estrutura
--   SELECT count(*) FROM instituidores;            -- deve ser 0
-- ════════════════════════════════════════════════════════════════════════════


-- ════════════════════════ UP START ══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS instituidores (

  -- Identidade
  id                          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id                   UUID        NOT NULL REFERENCES tenants(id),
  processo_id                 UUID        NOT NULL REFERENCES processos(id) ON DELETE RESTRICT,

  -- Dados do falecido
  nome_completo               TEXT        NOT NULL,
  cpf                         TEXT,
  rg                          TEXT,
  data_nascimento             DATE,
  data_obito                  DATE        NOT NULL,

  -- Qualidade previdenciária: define se o falecido ainda tinha qualidade de segurado ao morrer
  qualidade_previdenciaria    TEXT        NOT NULL
                              CHECK (qualidade_previdenciaria IN (
                                'segurado_ativo',
                                'aposentado',
                                'pensionista',
                                'segurado_em_periodo_graca'
                              )),

  -- Referência ao benefício pré-existente (se já era aposentado/pensionista)
  numero_beneficio_origem     TEXT,

  -- Base para cálculo da pensão
  ultima_remuneracao          DECIMAL(10,2),

  observacoes                 TEXT,

  -- Soft delete (nunca hard delete — histórico jurídico é ativo permanente)
  archived_at                 TIMESTAMPTZ,
  archived_by                 UUID,
  archive_reason              TEXT,

  -- Auditoria
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()

);

-- Índices
CREATE INDEX IF NOT EXISTS idx_instituidores_processo_id  ON instituidores(processo_id);
CREATE INDEX IF NOT EXISTS idx_instituidores_tenant_id    ON instituidores(tenant_id);
CREATE INDEX IF NOT EXISTS idx_instituidores_archived_at  ON instituidores(archived_at) WHERE archived_at IS NOT NULL;


-- ── Trigger: updated_at automático ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_update_instituidores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_instituidores_updated_at
  BEFORE UPDATE ON instituidores
  FOR EACH ROW EXECUTE FUNCTION fn_update_instituidores_updated_at();


-- ── RLS ──────────────────────────────────────────────────────────────────────
-- O app usa a service key (bypassa RLS), mas a policy é definida por consistência.

ALTER TABLE instituidores ENABLE ROW LEVEL SECURITY;

-- ════════════════════════ UP END ════════════════════════════════════════════


-- ════════════════════════ DOWN START ════════════════════════════════════════

-- DROP TRIGGER IF EXISTS trg_instituidores_updated_at ON instituidores;
-- DROP FUNCTION IF EXISTS fn_update_instituidores_updated_at();
-- DROP TABLE IF EXISTS instituidores;

-- ════════════════════════ DOWN END ══════════════════════════════════════════

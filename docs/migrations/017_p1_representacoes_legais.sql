-- ════════════════════════════════════════════════════════════════════════════
-- Migration 017 — Frente 3 P1: Tabela representacoes_legais
-- Projeto: JusDoc — Rocha & Alencar Advocacia
-- Data: 2026-05-15
--
-- UP: Cria tabela `representacoes_legais` (representante legal de menor ou
--     incapaz no processo: tutor, curador, responsável por termo de guarda, etc.).
--     Genérica: aplica-se a Pensão por Morte com menores, BPC menor, BPC incapaz.
--     Soft delete via archived_at/archived_by/archive_reason.
--     ON DELETE RESTRICT: hard delete de processo é rejeitado pelo banco.
--
-- DOWN: Remove tabela.
--
-- VALIDAÇÃO (executar APÓS o UP):
--   \d representacoes_legais                       -- confirmar estrutura
--   SELECT count(*) FROM representacoes_legais;    -- deve ser 0
-- ════════════════════════════════════════════════════════════════════════════


-- ════════════════════════ UP START ══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS representacoes_legais (

  -- Identidade
  id                              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id                       UUID        NOT NULL REFERENCES tenants(id),
  processo_id                     UUID        NOT NULL REFERENCES processos(id) ON DELETE RESTRICT,

  -- Dados do representante
  representante_nome              TEXT        NOT NULL,
  representante_cpf               TEXT        NOT NULL,
  representante_rg                TEXT,

  -- Qualidade conforme Termo de Responsabilidade do INSS
  qualidade                       TEXT        NOT NULL
                                  CHECK (qualidade IN (
                                    'tutor_nato',
                                    'tutor_legal',
                                    'curador',
                                    'responsavel_termo_guarda',
                                    'administrador_provisorio',
                                    'procurador'
                                  )),

  -- Array JSON de beneficiários representados: [{nome, cpf?}, ...]
  -- Até 4 beneficiários conforme estrutura do Termo de Responsabilidade do INSS
  beneficiarios_representados     JSONB       NOT NULL DEFAULT '[]'::jsonb,

  -- Documento que comprova a representação
  documento_comprobatorio_tipo    TEXT,
  documento_comprobatorio_numero  TEXT,

  -- Soft delete (nunca hard delete — histórico jurídico é ativo permanente)
  archived_at                     TIMESTAMPTZ,
  archived_by                     UUID,
  archive_reason                  TEXT,

  -- Auditoria
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT now()

);

-- Índices
CREATE INDEX IF NOT EXISTS idx_representacoes_processo_id  ON representacoes_legais(processo_id);
CREATE INDEX IF NOT EXISTS idx_representacoes_tenant_id    ON representacoes_legais(tenant_id);
CREATE INDEX IF NOT EXISTS idx_representacoes_archived_at  ON representacoes_legais(archived_at) WHERE archived_at IS NOT NULL;


-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE representacoes_legais ENABLE ROW LEVEL SECURITY;

-- ════════════════════════ UP END ════════════════════════════════════════════


-- ════════════════════════ DOWN START ════════════════════════════════════════

-- DROP TABLE IF EXISTS representacoes_legais;

-- ════════════════════════ DOWN END ══════════════════════════════════════════

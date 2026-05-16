-- ════════════════════════════════════════════════════════════════════════════
-- Migration 016 — Frente 3 P1: Tabela documentos_processo
-- Projeto: JusDoc — Rocha & Alencar Advocacia
-- Data: 2026-05-15
--
-- UP: Cria tabela `documentos_processo` (documentos anexados ao processo,
--     como certidão de óbito, RG do instituidor, comprovante de dependência, etc.).
--     A certidão de óbito é obrigatória para Pensão por Morte.
--     Soft delete via archived_at/archived_by/archive_reason.
--     ON DELETE RESTRICT: hard delete de processo é rejeitado pelo banco.
--
-- DOWN: Remove tabela.
--
-- VALIDAÇÃO (executar APÓS o UP):
--   \d documentos_processo                         -- confirmar estrutura
--   SELECT count(*) FROM documentos_processo;      -- deve ser 0
-- ════════════════════════════════════════════════════════════════════════════


-- ════════════════════════ UP START ══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS documentos_processo (

  -- Identidade
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID        NOT NULL REFERENCES tenants(id),
  processo_id     UUID        NOT NULL REFERENCES processos(id) ON DELETE RESTRICT,

  -- Classificação do documento
  tipo            TEXT        NOT NULL
                  CHECK (tipo IN (
                    'certidao_obito',
                    'rg_instituidor',
                    'comprovante_dependencia',
                    'certidao_casamento',
                    'certidao_nascimento_filho',
                    'comprovante_uniao_estavel',
                    'laudo_pericial_invalidez',
                    'declaracao_dependencia_economica',
                    'outro'
                  )),

  -- Arquivo no Supabase Storage
  nome_arquivo    TEXT        NOT NULL,
  storage_path    TEXT        NOT NULL,

  -- Quem fez o upload (referencia tabela users do projeto, sem FK para auth.users)
  uploaded_by     UUID,

  -- Para Pensão por Morte: certidao_obito tem obrigatorio = TRUE
  obrigatorio     BOOLEAN     NOT NULL DEFAULT FALSE,

  observacoes     TEXT,

  -- Soft delete (nunca hard delete — histórico jurídico é ativo permanente)
  archived_at     TIMESTAMPTZ,
  archived_by     UUID,
  archive_reason  TEXT,

  -- Auditoria
  uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT now()

);

-- Índices
CREATE INDEX IF NOT EXISTS idx_documentos_processo_id  ON documentos_processo(processo_id);
CREATE INDEX IF NOT EXISTS idx_documentos_tenant_id    ON documentos_processo(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documentos_tipo         ON documentos_processo(tipo);
CREATE INDEX IF NOT EXISTS idx_documentos_archived_at  ON documentos_processo(archived_at) WHERE archived_at IS NOT NULL;


-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE documentos_processo ENABLE ROW LEVEL SECURITY;

-- ════════════════════════ UP END ════════════════════════════════════════════


-- ════════════════════════ DOWN START ════════════════════════════════════════

-- DROP TABLE IF EXISTS documentos_processo;

-- ════════════════════════ DOWN END ══════════════════════════════════════════

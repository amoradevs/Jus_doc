-- ════════════════════════════════════════════════════════════════════════════
-- Migration 018 — Frente 3 P1: Soft delete em processos + cascata de arquivamento
-- Projeto: JusDoc — Rocha & Alencar Advocacia
-- Data: 2026-05-15
--
-- ⚠️  ATENÇÃO: esta migration altera tabela existente em produção (`processos`).
--     Aplicar em horário de baixo uso. Operações são não-destrutivas (ADD COLUMN).
--
-- UP: 1. Adiciona campos de soft delete em `processos`
--     2. Cria trigger de cascata: arquivar processo → arquiva entidades filhas
--     3. Cria trigger de cascata: desarquivar processo → restaura entidades filhas
--
-- DOWN: Remove trigger, função e colunas (DESTRUTIVO — apaga dados de arquivamento).
--
-- NOTA SOBRE nomenclatura:
--   A tabela `clients` usa o campo `deletado_em` (soft delete simples).
--   `processos` e as 4 novas tabelas (014-017) usam `archived_at/archived_by/archive_reason`
--   para refletir a semântica de arquivamento jurídico com auditoria de motivo.
--   São padrões distintos: clients = exclusão lógica; processos = arquivamento auditável.
--
-- VALIDAÇÃO (executar APÓS o UP):
--   \d processos                                            -- confirmar 3 novas colunas
--   SELECT archived_at, archived_by, archive_reason
--     FROM processos LIMIT 5;                              -- todas devem ser NULL
--   \df arquivar_entidades_filhas_processo                 -- confirmar função criada
-- ════════════════════════════════════════════════════════════════════════════


-- ════════════════════════ UP START ══════════════════════════════════════════

-- ── 1. Adicionar campos de soft delete em processos ──────────────────────────

ALTER TABLE processos
  ADD COLUMN IF NOT EXISTS archived_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_by      UUID,
  ADD COLUMN IF NOT EXISTS archive_reason   TEXT;

-- Índice parcial: só indexa registros arquivados (raridade — performance)
CREATE INDEX IF NOT EXISTS idx_processos_archived_at
  ON processos(archived_at)
  WHERE archived_at IS NOT NULL;


-- ── 2. Função de cascata de arquivamento ─────────────────────────────────────
--
-- Quando processo é arquivado (archived_at NULL → preenchido):
--   → entidades filhas ativas são arquivadas com o mesmo timestamp e responsável
--
-- Quando processo é desarquivado (archived_at preenchido → NULL):
--   → entidades filhas que foram arquivadas JUNTO COM o processo voltam ao ativo
--   → entidades arquivadas individualmente (archived_by diferente ou anterior)
--     NÃO são revertidas (preserva arquivamentos manuais independentes)

CREATE OR REPLACE FUNCTION arquivar_entidades_filhas_processo()
RETURNS TRIGGER AS $$
BEGIN

  -- ── Arquivamento: processo passou de ativo para arquivado ──────────────────
  IF NEW.archived_at IS NOT NULL AND OLD.archived_at IS NULL THEN

    UPDATE instituidores
      SET archived_at     = NEW.archived_at,
          archived_by     = NEW.archived_by,
          archive_reason  = 'Arquivamento em cascata do processo ' || NEW.id::TEXT
      WHERE processo_id = NEW.id
        AND archived_at IS NULL;

    UPDATE dependentes_habilitados
      SET archived_at     = NEW.archived_at,
          archived_by     = NEW.archived_by,
          archive_reason  = 'Arquivamento em cascata do processo ' || NEW.id::TEXT
      WHERE processo_id = NEW.id
        AND archived_at IS NULL;

    UPDATE documentos_processo
      SET archived_at     = NEW.archived_at,
          archived_by     = NEW.archived_by,
          archive_reason  = 'Arquivamento em cascata do processo ' || NEW.id::TEXT
      WHERE processo_id = NEW.id
        AND archived_at IS NULL;

    UPDATE representacoes_legais
      SET archived_at     = NEW.archived_at,
          archived_by     = NEW.archived_by,
          archive_reason  = 'Arquivamento em cascata do processo ' || NEW.id::TEXT
      WHERE processo_id = NEW.id
        AND archived_at IS NULL;

  END IF;

  -- ── Desarquivamento: processo voltou ao estado ativo ──────────────────────
  -- Só reverte entidades que foram arquivadas com exatamente o mesmo timestamp
  -- (arquivamento em cascata). Arquivamentos manuais anteriores são preservados.
  IF NEW.archived_at IS NULL AND OLD.archived_at IS NOT NULL THEN

    UPDATE instituidores
      SET archived_at     = NULL,
          archived_by     = NULL,
          archive_reason  = NULL
      WHERE processo_id = NEW.id
        AND archived_at = OLD.archived_at;

    UPDATE dependentes_habilitados
      SET archived_at     = NULL,
          archived_by     = NULL,
          archive_reason  = NULL
      WHERE processo_id = NEW.id
        AND archived_at = OLD.archived_at;

    UPDATE documentos_processo
      SET archived_at     = NULL,
          archived_by     = NULL,
          archive_reason  = NULL
      WHERE processo_id = NEW.id
        AND archived_at = OLD.archived_at;

    UPDATE representacoes_legais
      SET archived_at     = NULL,
          archived_by     = NULL,
          archive_reason  = NULL
      WHERE processo_id = NEW.id
        AND archived_at = OLD.archived_at;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ── 3. Trigger: dispara AFTER UPDATE em processos ────────────────────────────

CREATE TRIGGER trigger_arquivar_entidades_filhas
  AFTER UPDATE ON processos
  FOR EACH ROW
  EXECUTE FUNCTION arquivar_entidades_filhas_processo();

-- ════════════════════════ UP END ════════════════════════════════════════════


-- ════════════════════════ DOWN START ════════════════════════════════════════

-- ⚠️  DESTRUTIVO: apaga dados de arquivamento. Execute só se nenhum processo
--     foi arquivado ainda (confirme: SELECT count(*) FROM processos WHERE archived_at IS NOT NULL).

-- DROP TRIGGER IF EXISTS trigger_arquivar_entidades_filhas ON processos;
-- DROP FUNCTION IF EXISTS arquivar_entidades_filhas_processo();
-- DROP INDEX IF EXISTS idx_processos_archived_at;
-- ALTER TABLE processos
--   DROP COLUMN IF EXISTS archived_at,
--   DROP COLUMN IF EXISTS archived_by,
--   DROP COLUMN IF EXISTS archive_reason;

-- ════════════════════════ DOWN END ══════════════════════════════════════════

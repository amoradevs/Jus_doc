-- ════════════════════════════════════════════════════════════════════════════
-- Migration 012 — Bloco B: Tracker de Prazos Processuais
-- Projeto: JusDoc — Rocha & Alencar Advocacia
-- Data: 2026-05-08
--
-- UP: Cria tabela `prazos` (entidade de prazo estruturado por processo)
--     e `prazo_logs` (auditoria de mudanças de status).
--
-- DOWN: Remove tabelas (não há dados migráveis — tabela nova).
--
-- COMO USAR:
--   UP   → execute o bloco entre === UP START === e === UP END ===
--   DOWN → execute o bloco entre === DOWN START === e === DOWN END ===
--
-- VALIDAÇÃO (executar APÓS o UP):
--   \d prazos                                     -- confirmar estrutura
--   SELECT count(*) FROM prazo_logs;              -- deve ser 0 (tabela nova)
-- ════════════════════════════════════════════════════════════════════════════


-- ════════════════════════ UP START ══════════════════════════════════════════

-- ── 1. Tabela prazos ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS prazos (

  -- Identidade
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID        NOT NULL REFERENCES tenants(id),
  processo_id     UUID        NOT NULL REFERENCES processos(id) ON DELETE CASCADE,

  -- Classificação
  categoria       TEXT        NOT NULL
                  CHECK (categoria IN (
                    'administrativo_inss',
                    'judicial',
                    'comercial_interno',
                    'evento'
                  )),

  -- Tipo livre (ex: "Resposta a exigência") — combobox com sugestões
  tipo            TEXT        NOT NULL,

  -- Detalhamento opcional
  descricao       TEXT,

  -- Datas do prazo
  data_inicio     DATE        NOT NULL,
  data_limite     DATE        NOT NULL,

  -- Contagem em dias úteis (true = exclui fins de semana, feriados, recesso forense)
  dias_uteis      BOOLEAN     NOT NULL DEFAULT FALSE,

  -- Ciclo de vida
  status          TEXT        NOT NULL DEFAULT 'pendente'
                  CHECK (status IN ('pendente', 'cumprido', 'perdido', 'cancelado')),

  -- Preenchidos quando status = cumprido
  data_cumprimento        DATE,
  anotacao_cumprimento    TEXT,

  -- Auditoria (referencia tabela users do projeto, sem FK para auth.users)
  created_by      UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()

);

-- Índices
CREATE INDEX IF NOT EXISTS idx_prazos_processo_id  ON prazos(processo_id);
CREATE INDEX IF NOT EXISTS idx_prazos_tenant_id    ON prazos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_prazos_status       ON prazos(status);
CREATE INDEX IF NOT EXISTS idx_prazos_data_limite  ON prazos(data_limite);


-- ── 2. Trigger: updated_at automático ────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_update_prazos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prazos_updated_at
  BEFORE UPDATE ON prazos
  FOR EACH ROW EXECUTE FUNCTION fn_update_prazos_updated_at();


-- ── 3. Tabela prazo_logs (auditoria de mudanças de status) ───────────────────

CREATE TABLE IF NOT EXISTS prazo_logs (

  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  prazo_id        UUID        NOT NULL REFERENCES prazos(id) ON DELETE CASCADE,
  tenant_id       UUID        NOT NULL REFERENCES tenants(id),

  -- Transição de status
  status_anterior TEXT,
  status_novo     TEXT        NOT NULL,

  -- Quem e quando (referencia tabela users do projeto, sem FK para auth.users)
  user_id         UUID,
  anotacao        TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()

);

CREATE INDEX IF NOT EXISTS idx_prazo_logs_prazo_id ON prazo_logs(prazo_id);
CREATE INDEX IF NOT EXISTS idx_prazo_logs_tenant_id ON prazo_logs(tenant_id);


-- ── 4. RLS ───────────────────────────────────────────────────────────────────
-- O app usa a service key (bypassa RLS), mas a policy é definida por consistência.

ALTER TABLE prazos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE prazo_logs ENABLE ROW LEVEL SECURITY;

-- ════════════════════════ UP END ════════════════════════════════════════════


-- ════════════════════════ DOWN START ════════════════════════════════════════

-- DROP TRIGGER IF EXISTS trg_prazos_updated_at ON prazos;
-- DROP FUNCTION IF EXISTS fn_update_prazos_updated_at();
-- DROP TABLE IF EXISTS prazo_logs;
-- DROP TABLE IF EXISTS prazos;

-- ════════════════════════ DOWN END ══════════════════════════════════════════

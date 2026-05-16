-- ════════════════════════════════════════════════════════════════════════════
-- Migration 015 — Frente 3 P1: Tabela dependentes_habilitados
-- Projeto: JusDoc — Rocha & Alencar Advocacia
-- Data: 2026-05-15
--
-- UP: Cria tabela `dependentes_habilitados` (pessoas habilitadas a receber
--     a pensão). Múltiplos dependentes podem estar habilitados ao mesmo processo.
--     Soft delete via archived_at/archived_by/archive_reason.
--     ON DELETE RESTRICT: hard delete de processo é rejeitado pelo banco.
--
-- DOWN: Remove tabela.
--
-- VALIDAÇÃO (executar APÓS o UP):
--   \d dependentes_habilitados                     -- confirmar estrutura
--   SELECT count(*) FROM dependentes_habilitados;  -- deve ser 0
-- ════════════════════════════════════════════════════════════════════════════


-- ════════════════════════ UP START ══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dependentes_habilitados (

  -- Identidade
  id                      UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID        NOT NULL REFERENCES tenants(id),
  processo_id             UUID        NOT NULL REFERENCES processos(id) ON DELETE RESTRICT,

  -- Vínculo opcional com cliente cadastrado no sistema (geralmente o titular adulto)
  cliente_id              UUID        REFERENCES clients(id),

  -- Dados do dependente
  nome_completo           TEXT        NOT NULL,
  cpf                     TEXT,
  rg                      TEXT,
  data_nascimento         DATE        NOT NULL,

  -- Relação com o instituidor: define a regra previdenciária aplicável
  relacao_com_instituidor TEXT        NOT NULL
                          CHECK (relacao_com_instituidor IN (
                            'conjuge',
                            'companheiro',
                            'filho_menor',
                            'filho_invalido_maior',
                            'filho_universitario_ate_24',
                            'pais',
                            'irmao_menor',
                            'irmao_invalido'
                          )),

  -- Quota-parte do benefício (soma de todos os dependentes do mesmo processo = 100%)
  cota_parte_percentual   DECIMAL(5,2),

  -- Indica qual dependente é o "cliente principal" do escritório (assina o contrato)
  e_titular_no_sistema    BOOLEAN     NOT NULL DEFAULT FALSE,

  observacoes             TEXT,

  -- Soft delete (nunca hard delete — histórico jurídico é ativo permanente)
  archived_at             TIMESTAMPTZ,
  archived_by             UUID,
  archive_reason          TEXT,

  -- Auditoria
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()

);

-- Índices
CREATE INDEX IF NOT EXISTS idx_dependentes_processo_id  ON dependentes_habilitados(processo_id);
CREATE INDEX IF NOT EXISTS idx_dependentes_cliente_id   ON dependentes_habilitados(cliente_id);
CREATE INDEX IF NOT EXISTS idx_dependentes_tenant_id    ON dependentes_habilitados(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dependentes_archived_at  ON dependentes_habilitados(archived_at) WHERE archived_at IS NOT NULL;

-- Constraint: apenas um titular por processo (entre os registros ativos)
CREATE UNIQUE INDEX IF NOT EXISTS idx_dependentes_titular_unico
  ON dependentes_habilitados(processo_id)
  WHERE e_titular_no_sistema = TRUE AND archived_at IS NULL;


-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE dependentes_habilitados ENABLE ROW LEVEL SECURITY;

-- ════════════════════════ UP END ════════════════════════════════════════════


-- ════════════════════════ DOWN START ════════════════════════════════════════

-- DROP TABLE IF EXISTS dependentes_habilitados;

-- ════════════════════════ DOWN END ══════════════════════════════════════════

-- ════════════════════════════════════════════════════════════════════════════
-- Migration 011 — Bloco A: Separação Cliente × Processo
-- Projeto: JusDoc — Rocha & Alencar Advocacia
-- Data: 2026-05-08
--
-- UP: Cria tabela `processos`, migra dados existentes de `clients`,
--     remove colunas de processo de `clients`.
--
-- DOWN: Reverte tudo — re-adiciona colunas em `clients`, copia dados
--       de volta de `processos`, apaga a tabela e os triggers.
--
-- COMO USAR:
--   UP   → execute o bloco entre === UP START === e === UP END ===
--   DOWN → execute o bloco entre === DOWN START === e === DOWN END ===
--
-- VALIDAÇÃO (executar APÓS o UP, ANTES do DOWN):
--   SELECT count(*) FROM processos;                  -- deve bater com clientes migrados
--   SELECT * FROM processos LIMIT 5;                 -- inspecionar dados
--   \d clients                                        -- confirmar que colunas foram removidas
-- ════════════════════════════════════════════════════════════════════════════


-- ════════════════════════ UP START ══════════════════════════════════════════

-- ── 1. Tabela processos ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS processos (

  -- Identidade
  id                        UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id                 UUID        NOT NULL REFERENCES tenants(id),
  cliente_id                UUID        NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,

  -- Número de identificação gerado automaticamente (trigger abaixo)
  numero_interno            TEXT        NOT NULL UNIQUE,

  -- Classificação do benefício pleiteado
  -- NULL permitido: tipos antigos sem mapeamento direto para o novo enum
  tipo_beneficio            TEXT        CHECK (tipo_beneficio IN (
                              'aposentadoria_idade_urbana',
                              'aposentadoria_idade_rural',
                              'aposentadoria_tempo_contribuicao',
                              'bpc_idoso',
                              'bpc_deficiente_adulto',
                              'bpc_deficiente_menor_16',
                              'bpc_deficiente_16_18',
                              'mandado_seguranca',
                              'pensao_morte',
                              'auxilio_doenca'
                            )),

  -- Etapa no Kanban
  etapa_pipeline            TEXT        NOT NULL DEFAULT 'triagem'
                            CHECK (etapa_pipeline IN (
                              'triagem', 'consulta', 'documentos', 'aguardando_inss',
                              'pericia', 'judicial', 'concedido', 'encerrado'
                            )),

  -- Resultado/situação atual
  status_resultado          TEXT        NOT NULL DEFAULT 'em_andamento'
                            CHECK (status_resultado IN (
                              'em_andamento', 'exigencia', 'deferido', 'indeferido',
                              'recurso_administrativo', 'judicializado', 'arquivado'
                            )),

  -- Referências externas
  numero_protocolo_inss     TEXT,
  numero_processo_judicial  TEXT,

  -- Datas do processo
  data_entrada              DATE,
  dib_pleiteada             DATE,

  -- Anotações e agenda (campos transitórios migrados de clients)
  -- Estes campos serão substituídos pela tabela prazos no Bloco B
  observacao_pipeline       TEXT,
  data_proxima_audiencia    DATE,
  data_prazo                DATE,
  tipo_evento               TEXT        CHECK (tipo_evento IN (
                              'audiencia', 'pericia', 'consulta', 'prazo', 'outro'
                            )),
  descricao_evento          TEXT,

  -- Auditoria
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()

);

-- Índices
CREATE INDEX IF NOT EXISTS idx_processos_cliente_id  ON processos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_processos_tenant_id   ON processos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_processos_etapa       ON processos(etapa_pipeline);
CREATE INDEX IF NOT EXISTS idx_processos_status      ON processos(status_resultado);


-- ── 2. Trigger: numero_interno (formato ANO-NNNN, reinicia por ano) ──────────
--
-- Lógica: no INSERT, se numero_interno não foi fornecido,
-- calcula MAX(sequencial do ano corrente) + 1 e formata como YYYY-NNNN.
-- Para volumes < 1000 processos/ano, o COUNT é seguro (sem concorrência real).

CREATE OR REPLACE FUNCTION fn_gerar_numero_interno()
RETURNS TRIGGER AS $$
DECLARE
  v_ano  TEXT;
  v_seq  INT;
BEGIN
  v_ano := TO_CHAR(NOW() AT TIME ZONE 'America/Sao_Paulo', 'YYYY');

  SELECT COALESCE(
    MAX(CAST(SPLIT_PART(numero_interno, '-', 2) AS INT)),
    0
  ) + 1
  INTO v_seq
  FROM processos
  WHERE numero_interno LIKE v_ano || '-%';

  NEW.numero_interno := v_ano || '-' || LPAD(v_seq::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_processos_numero_interno
  BEFORE INSERT ON processos
  FOR EACH ROW
  WHEN (NEW.numero_interno IS NULL OR NEW.numero_interno = '')
  EXECUTE FUNCTION fn_gerar_numero_interno();


-- ── 3. Trigger: updated_at automático ────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_processos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_processos_updated_at
  BEFORE UPDATE ON processos
  FOR EACH ROW
  EXECUTE FUNCTION fn_processos_updated_at();


-- ── 4. Migração dos dados existentes ─────────────────────────────────────────
--
-- Cria um processo para cada cliente com tipo_pedido não nulo.
-- O trigger fn_gerar_numero_interno dispara automaticamente para cada linha.
--
-- MAPEAMENTO tipo_pedido → tipo_beneficio:
--   apos_idade        → aposentadoria_idade_urbana
--   apos_rural        → aposentadoria_idade_rural
--   apos_tempo        → aposentadoria_tempo_contribuicao
--   mandado_seguranca → mandado_seguranca
--   pensao_morte      → pensao_morte
--   aux_incapacidade  → auxilio_doenca
--   bpc_loas          → NULL (ambíguo: pode ser bpc_idoso, bpc_deficiente_adulto,
--                              bpc_deficiente_menor_16 ou bpc_deficiente_16_18)
--   demais            → NULL (sem equivalente direto no novo enum)
--
-- Se existirem clientes com tipo_pedido = 'bpc_loas', atualize manualmente:
--   UPDATE processos SET tipo_beneficio = 'bpc_idoso' WHERE id = '<uuid>';

INSERT INTO processos (
  tenant_id,
  cliente_id,
  numero_interno,      -- deixado vazio → trigger preenche
  tipo_beneficio,
  etapa_pipeline,
  status_resultado,
  data_entrada,
  observacao_pipeline,
  data_proxima_audiencia,
  data_prazo,
  tipo_evento,
  descricao_evento
)
SELECT
  c.tenant_id,
  c.id                        AS cliente_id,
  ''                          AS numero_interno,
  CASE c.tipo_pedido
    WHEN 'apos_idade'          THEN 'aposentadoria_idade_urbana'
    WHEN 'apos_rural'          THEN 'aposentadoria_idade_rural'
    WHEN 'apos_tempo'          THEN 'aposentadoria_tempo_contribuicao'
    WHEN 'mandado_seguranca'   THEN 'mandado_seguranca'
    WHEN 'pensao_morte'        THEN 'pensao_morte'
    WHEN 'aux_incapacidade'    THEN 'auxilio_doenca'
    ELSE NULL
  END                         AS tipo_beneficio,
  COALESCE(c.etapa_pipeline, 'triagem')   AS etapa_pipeline,
  CASE c.status_pedido
    WHEN 'deferido'    THEN 'deferido'
    WHEN 'indeferido'  THEN 'indeferido'
    ELSE 'em_andamento'
  END                         AS status_resultado,
  c.data_entrada_pedido       AS data_entrada,
  c.observacao_pipeline,
  c.data_proxima_audiencia,
  c.data_prazo,
  c.tipo_evento,
  c.descricao_evento
FROM clients c
WHERE c.deletado_em IS NULL
  AND c.tipo_pedido IS NOT NULL;


-- ── 5. Remover colunas de processo de clients ─────────────────────────────────
--
-- ATENÇÃO: após este passo, o código da aplicação que lê tipo_pedido,
-- etapa_pipeline, status_pedido etc. de clients vai retornar erro.
-- Isso é esperado — a Sessão 3 atualiza o código.

ALTER TABLE clients
  DROP COLUMN IF EXISTS tipo_pedido,
  DROP COLUMN IF EXISTS status_pedido,
  DROP COLUMN IF EXISTS data_entrada_pedido,
  DROP COLUMN IF EXISTS etapa_pipeline,
  DROP COLUMN IF EXISTS observacao_pipeline,
  DROP COLUMN IF EXISTS data_proxima_audiencia,
  DROP COLUMN IF EXISTS data_prazo,
  DROP COLUMN IF EXISTS tipo_evento,
  DROP COLUMN IF EXISTS descricao_evento;

-- ════════════════════════ UP END ════════════════════════════════════════════



-- ════════════════════════ DOWN START ════════════════════════════════════════

-- ── DOWN 1. Re-adicionar colunas de processo em clients ───────────────────────
--
-- Usa ADD COLUMN IF NOT EXISTS para idempotência.
-- NOT NULL DEFAULT 'triagem' em etapa_pipeline garante que rows existentes
-- (clientes sem processo) recebam um valor válido.

/*

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS tipo_pedido               TEXT,
  ADD COLUMN IF NOT EXISTS status_pedido             TEXT
                           CHECK (status_pedido IN ('deferido', 'indeferido')),
  ADD COLUMN IF NOT EXISTS data_entrada_pedido       DATE,
  ADD COLUMN IF NOT EXISTS etapa_pipeline            TEXT NOT NULL DEFAULT 'triagem'
                           CHECK (etapa_pipeline IN (
                             'triagem', 'consulta', 'documentos', 'aguardando_inss',
                             'pericia', 'judicial', 'concedido', 'encerrado'
                           )),
  ADD COLUMN IF NOT EXISTS observacao_pipeline       TEXT,
  ADD COLUMN IF NOT EXISTS data_proxima_audiencia    DATE,
  ADD COLUMN IF NOT EXISTS data_prazo                DATE,
  ADD COLUMN IF NOT EXISTS tipo_evento               TEXT
                           CHECK (tipo_evento IN (
                             'audiencia', 'pericia', 'consulta', 'prazo', 'outro'
                           )),
  ADD COLUMN IF NOT EXISTS descricao_evento          TEXT;


-- ── DOWN 2. Restaurar dados de processo de volta para clients ─────────────────
--
-- Mapeamento inverso: tipo_beneficio → tipo_pedido
-- Clientes sem processo mantêm todas as colunas como NULL / default.

UPDATE clients c
SET
  tipo_pedido = CASE p.tipo_beneficio
    WHEN 'aposentadoria_idade_urbana'       THEN 'apos_idade'
    WHEN 'aposentadoria_idade_rural'        THEN 'apos_rural'
    WHEN 'aposentadoria_tempo_contribuicao' THEN 'apos_tempo'
    WHEN 'mandado_seguranca'                THEN 'mandado_seguranca'
    WHEN 'pensao_morte'                     THEN 'pensao_morte'
    WHEN 'auxilio_doenca'                   THEN 'aux_incapacidade'
    -- bpc_loas não tem mapeamento inverso preciso; usa o valor mais genérico
    WHEN 'bpc_idoso'                        THEN 'bpc_loas'
    WHEN 'bpc_deficiente_adulto'            THEN 'bpc_loas'
    WHEN 'bpc_deficiente_menor_16'          THEN 'bpc_loas'
    WHEN 'bpc_deficiente_16_18'             THEN 'bpc_loas'
    ELSE NULL
  END,
  status_pedido = CASE p.status_resultado
    WHEN 'deferido'   THEN 'deferido'
    WHEN 'indeferido' THEN 'indeferido'
    ELSE NULL
  END,
  data_entrada_pedido     = p.data_entrada,
  etapa_pipeline          = p.etapa_pipeline,
  observacao_pipeline     = p.observacao_pipeline,
  data_proxima_audiencia  = p.data_proxima_audiencia,
  data_prazo              = p.data_prazo,
  tipo_evento             = p.tipo_evento,
  descricao_evento        = p.descricao_evento
FROM processos p
WHERE p.cliente_id = c.id
  AND c.deletado_em IS NULL;


-- ── DOWN 3. Remover triggers, funções e tabela ────────────────────────────────

DROP TRIGGER IF EXISTS trg_processos_numero_interno ON processos;
DROP TRIGGER IF EXISTS trg_processos_updated_at     ON processos;
DROP FUNCTION IF EXISTS fn_gerar_numero_interno();
DROP FUNCTION IF EXISTS fn_processos_updated_at();
DROP INDEX   IF EXISTS idx_processos_cliente_id;
DROP INDEX   IF EXISTS idx_processos_tenant_id;
DROP INDEX   IF EXISTS idx_processos_etapa;
DROP INDEX   IF EXISTS idx_processos_status;
DROP TABLE   IF EXISTS processos;

*/

-- ════════════════════════ DOWN END ══════════════════════════════════════════

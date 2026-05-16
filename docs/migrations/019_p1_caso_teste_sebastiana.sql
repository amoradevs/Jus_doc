-- ════════════════════════════════════════════════════════════════════════════
-- Migration 019 — Frente 3 P1: Caso de teste — Sebastiana Marta Gomes
-- Projeto: JusDoc — Rocha & Alencar Advocacia
-- Data: 2026-05-15
--
-- Propósito: Validar que as 4 novas entidades (014-017) persistem corretamente
--            e que o ciclo de arquivamento/desarquivamento funciona.
--
-- CENÁRIO:
--   - Cliente: Sebastiana Marta Gomes de Sousa Generoso (CPF 013.588.698-80)
--   - Processo: Pensão por morte do marido Francisco Generoso da Silva
--   - Instituidor: Francisco Generoso da Silva (falecido)
--   - Dependente habilitada: Sebastiana (única, 100% de cota-parte, titular)
--   - Sem menores → sem representação legal
--   - Documento obrigatório: certidão de óbito (simulada com storage_path de teste)
--
-- COMO USAR:
--   PASSO 1 — Verificar que Sebastiana já existe como cliente:
--     SELECT id, nome_completo, cpf FROM clients WHERE cpf = '01358869880';
--     → copie o id da Sebastiana para usar no PASSO 2
--
--   PASSO 2 — Verificar que o processo de Sebastiana existe:
--     SELECT id, tipo_beneficio, status_resultado FROM processos WHERE cliente_id = '<id_sebastiana>';
--     → copie o id do processo para usar nos passos seguintes
--
--   PASSO 3 — Se Sebastiana não existir, crie-a e crie o processo:
--     (descrito abaixo em bloco separado)
--
--   PASSO 4 — Insira as entidades P1 (abaixo)
--
--   PASSO 5 — Valide o ciclo de arquivamento (abaixo)
--
-- ════════════════════════════════════════════════════════════════════════════


-- ════════════════════════ PASSO 3 (só se necessário) ════════════════════════
-- Se Sebastiana não existir como cliente no sistema, crie-a primeiro:

/*
-- 3a. Criar cliente Sebastiana (ajuste tenant_id para o valor real do seu tenant)
INSERT INTO clients (
  tenant_id,
  nome_completo,
  cpf,
  data_nascimento,
  genero,
  estado_civil,
  nacionalidade,
  nome_mae,
  endereco_logradouro,
  endereco_numero,
  endereco_bairro,
  endereco_cidade,
  endereco_uf,
  endereco_cep
) VALUES (
  (SELECT id FROM tenants LIMIT 1),  -- ajuste para o tenant correto
  'Sebastiana Marta Gomes de Sousa Generoso',
  '01358869880',
  '1965-03-10',
  'F',
  'viuvo',
  'brasileiro',
  'Maria Gomes de Sousa',
  'Rua Teste',
  '1',
  'Centro',
  'Fortaleza',
  'CE',
  '60000000'
)
RETURNING id;  -- copie este ID

-- 3b. Criar processo de pensão por morte para Sebastiana
INSERT INTO processos (
  tenant_id,
  cliente_id,
  numero_interno,
  tipo_beneficio,
  etapa_pipeline,
  status_resultado
) VALUES (
  (SELECT id FROM tenants LIMIT 1),
  '<id_sebastiana_do_passo_3a>',
  '',  -- trigger preenche automaticamente
  'pensao_morte',
  'documentos',
  'em_andamento'
)
RETURNING id;  -- copie este ID para os passos seguintes
*/


-- ════════════════════════ PASSO 4 — Inserir entidades P1 ════════════════════

-- Substitua as variáveis abaixo pelos valores reais antes de executar:
--   <TENANT_ID>   → id do tenant Rocha & Alencar
--   <PROCESSO_ID> → id do processo de pensão por morte da Sebastiana

-- ── 4a. Instituidor: Francisco Generoso da Silva ─────────────────────────────

INSERT INTO instituidores (
  tenant_id,
  processo_id,
  nome_completo,
  data_obito,
  qualidade_previdenciaria,
  observacoes
) VALUES (
  '<TENANT_ID>',
  '<PROCESSO_ID>',
  'Francisco Generoso da Silva',
  '2025-05-03',
  'aposentado',
  'Caso de teste P1 — Sebastiana Marta Gomes'
)
RETURNING id, nome_completo, data_obito, qualidade_previdenciaria;


-- ── 4b. Dependente habilitada: Sebastiana (única titular, 100%) ───────────────

INSERT INTO dependentes_habilitados (
  tenant_id,
  processo_id,
  cliente_id,
  nome_completo,
  cpf,
  data_nascimento,
  relacao_com_instituidor,
  cota_parte_percentual,
  e_titular_no_sistema,
  observacoes
) VALUES (
  '<TENANT_ID>',
  '<PROCESSO_ID>',
  (SELECT id FROM clients WHERE cpf = '01358869880' LIMIT 1),
  'Sebastiana Marta Gomes de Sousa Generoso',
  '01358869880',
  '1965-03-10',
  'conjuge',
  100.00,
  TRUE,
  'Cônjuge supérstite — dependente única, 100% de cota-parte'
)
RETURNING id, nome_completo, relacao_com_instituidor, cota_parte_percentual, e_titular_no_sistema;


-- ── 4c. Documento obrigatório: certidão de óbito (simulada) ──────────────────

INSERT INTO documentos_processo (
  tenant_id,
  processo_id,
  tipo,
  nome_arquivo,
  storage_path,
  obrigatorio,
  observacoes
) VALUES (
  '<TENANT_ID>',
  '<PROCESSO_ID>',
  'certidao_obito',
  'certidao_obito_francisco_generoso.pdf',
  'teste/certidao_obito_placeholder.pdf',
  TRUE,
  'Arquivo simulado para caso de teste P1'
)
RETURNING id, tipo, nome_arquivo, obrigatorio;


-- ════════════════════ PASSO 4 — Verificação ═════════════════════════════════

-- Confirme que tudo foi inserido:
/*
SELECT
  'instituidor' AS entidade, id, nome_completo AS info, archived_at
FROM instituidores WHERE processo_id = '<PROCESSO_ID>'
UNION ALL
SELECT
  'dependente', id, nome_completo, archived_at
FROM dependentes_habilitados WHERE processo_id = '<PROCESSO_ID>'
UNION ALL
SELECT
  'documento', id, nome_arquivo, archived_at
FROM documentos_processo WHERE processo_id = '<PROCESSO_ID>';
-- Resultado esperado: 3 linhas, archived_at = NULL em todas
*/


-- ════════════════════ PASSO 5 — Ciclo de arquivamento ══════════════════════

-- 5a. ARQUIVAR o processo (substitua <PROCESSO_ID> e <SEU_USER_ID>):
/*
UPDATE processos
SET
  archived_at    = now(),
  archived_by    = '<SEU_USER_ID>',
  archive_reason = 'Teste de arquivamento P1'
WHERE id = '<PROCESSO_ID>';
*/

-- 5b. Verificar cascata — todas as filhas devem estar arquivadas:
/*
SELECT 'processo' AS tabela, id, archived_at, archive_reason FROM processos WHERE id = '<PROCESSO_ID>'
UNION ALL
SELECT 'instituidor', id, archived_at, archive_reason FROM instituidores WHERE processo_id = '<PROCESSO_ID>'
UNION ALL
SELECT 'dependente', id, archived_at, archive_reason FROM dependentes_habilitados WHERE processo_id = '<PROCESSO_ID>'
UNION ALL
SELECT 'documento', id, archived_at, archive_reason FROM documentos_processo WHERE processo_id = '<PROCESSO_ID>';
-- Resultado esperado: 4 linhas, todas com archived_at preenchido
-- archive_reason das filhas: 'Arquivamento em cascata do processo <PROCESSO_ID>'
*/

-- 5c. Confirmar que o processo NÃO aparece em listagem padrão:
/*
SELECT count(*) FROM processos WHERE archived_at IS NULL AND id = '<PROCESSO_ID>';
-- Resultado esperado: 0
*/

-- 5d. Confirmar que aparece com filtro "incluir arquivados":
/*
SELECT id, archived_at, archive_reason FROM processos WHERE id = '<PROCESSO_ID>';
-- Resultado esperado: 1 linha com archived_at preenchido
*/

-- 5e. DESARQUIVAR o processo:
/*
UPDATE processos
SET
  archived_at    = NULL,
  archived_by    = NULL,
  archive_reason = NULL
WHERE id = '<PROCESSO_ID>';
*/

-- 5f. Confirmar que tudo voltou ao ativo:
/*
SELECT 'processo' AS tabela, id, archived_at FROM processos WHERE id = '<PROCESSO_ID>'
UNION ALL
SELECT 'instituidor', id, archived_at FROM instituidores WHERE processo_id = '<PROCESSO_ID>'
UNION ALL
SELECT 'dependente', id, archived_at FROM dependentes_habilitados WHERE processo_id = '<PROCESSO_ID>'
UNION ALL
SELECT 'documento', id, archived_at FROM documentos_processo WHERE processo_id = '<PROCESSO_ID>';
-- Resultado esperado: 4 linhas, todas com archived_at = NULL
*/

-- ════════════════════════ FIM DO CASO DE TESTE ═════════════════════════════

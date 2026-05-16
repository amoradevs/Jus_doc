# Snapshot pré-Fase 3 — Bloco A

**Data:** 2026-05-08  
**Operação seguinte:** Migration 011 — Separação Cliente × Processo

---

## Contexto

Os 5 clientes de teste foram deletados manualmente antes desta sessão (por decisão da usuária — dados eram fictícios, sem valor operacional). O snapshot abaixo reflete o banco **após a limpeza de dados, mas antes da alteração de schema**.

---

## Contagem de registros (estado atual)

| Tabela | Registros |
|--------|-----------|
| `tenants` | 1 (Rocha & Alencar) |
| `users` | 1–2 (advogadas) |
| `office_settings` | 1 |
| `clients` | **0** (deletados) |
| `client_contextual_data` | **0** |
| `case_documents` | **0** |
| `client_documents` | **0** |
| `generation_packages` | **0** |
| `generated_documents` | **0** |
| `document_templates` | 7 (templates ativos) |

---

## Schema de `clients` antes da migration 011

Estas são as colunas que existem hoje. As marcadas com `→ MOVE` serão removidas e migradas para `processos`.

### Dados de pessoa (permanecem em `clients`)

| Coluna | Tipo | Observação |
|--------|------|------------|
| `id` | uuid PK | |
| `tenant_id` | uuid FK | |
| `nome_completo` | text NOT NULL | |
| `nacionalidade` | text NOT NULL | default 'brasileiro' |
| `genero` | text NOT NULL | CHECK ('M', 'F') |
| `estado_civil` | text NOT NULL | |
| `data_nascimento` | date NOT NULL | |
| `cpf` | text NOT NULL | UNIQUE por tenant |
| `rg` | text NOT NULL | |
| `rg_orgao_emissor` | text NOT NULL | |
| `nome_mae` | text NOT NULL | |
| `nome_pai` | text | nullable |
| `telefone` | text | nullable — migration 005 |
| `senha_cadastro` | text | nullable — migration 009 |
| `sabe_assinar` | boolean NOT NULL | default true — migration 010 |
| `nit` | text | nullable — migration 010 |
| `endereco_logradouro` | text NOT NULL | |
| `endereco_numero` | text NOT NULL | |
| `endereco_complemento` | text | nullable |
| `endereco_bairro` | text NOT NULL | |
| `endereco_cidade` | text NOT NULL | |
| `endereco_uf` | text NOT NULL | |
| `endereco_cep` | text NOT NULL | |
| `criado_em` | timestamptz NOT NULL | default now() |
| `atualizado_em` | timestamptz NOT NULL | default now() |
| `deletado_em` | timestamptz | nullable (soft delete) |

### Dados de processo → MOVE para `processos`

| Coluna em `clients` | Coluna em `processos` | Tipo original |
|---------------------|----------------------|---------------|
| `tipo_pedido` | `tipo_beneficio` | text nullable |
| `status_pedido` | `status_resultado` | text CHECK ('deferido'\|'indeferido') |
| `data_entrada_pedido` | `data_entrada` | date nullable |
| `etapa_pipeline` | `etapa_pipeline` | text NOT NULL default 'triagem' |
| `observacao_pipeline` | `observacao_pipeline` | text nullable |
| `data_proxima_audiencia` | `data_proxima_audiencia` | date nullable — migration 006 |
| `data_prazo` | `data_prazo` | date nullable — migration 006 |
| `tipo_evento` | `tipo_evento` | text CHECK (5 valores) — migration 006 |
| `descricao_evento` | `descricao_evento` | text nullable — migration 007 |

---

## Outras tabelas com FK para `clients` (não alteradas nesta migration)

| Tabela | Coluna FK | Situação pós-migration 011 |
|--------|-----------|---------------------------|
| `client_contextual_data` | `client_id` | mantém FK em clients (dados de pessoa) — OK |
| `case_documents` | `client_id` | mantém FK em clients por ora — **a migrar para `processo_id` na Sessão 3** |
| `client_documents` | `client_id` | mantém FK em clients por ora — **a migrar para `processo_id` na Sessão 3** |
| `generation_packages` | `client_id` | mantém FK em clients por ora |

---

## Decisões tomadas nesta migration

1. **Campos de agenda incluídos em `processos`**: `data_proxima_audiencia`, `data_prazo`, `tipo_evento`, `descricao_evento` são semanticamente de processo, não de pessoa. São incluídos em `processos` como campo transitório — serão substituídos pela tabela `prazos` no Bloco B.

2. **`tipo_beneficio` é nullable**: O mapeamento de `tipo_pedido` → `tipo_beneficio` não é 1:1 para todos os tipos antigos (ex: `bpc_loas` abrange 4 sub-tipos novos). Com o banco vazio, isso não cria problema. Novos processos criados pela interface usarão o novo enum diretamente.

3. **`numero_interno` gerado por trigger**: formato `ANO-NNNN` (ex: `2026-0001`). O contador reinicia por ano. Para volumes baixos (< 1000/ano) de uma firma pequena, a implementação com COUNT é segura.

4. **Código da aplicação quebra até a Sessão 3**: após remover as colunas de processo de `clients`, páginas como `/clientes`, `/pipeline` e a home retornam erro porque ainda leem `tipo_pedido`, `etapa_pipeline` etc. de `clients`. Isso é esperado — a Sessão 3 atualiza o código.

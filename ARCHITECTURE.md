# Architecture Decision Records — JusDoc (Rocha & Alencar Advocacia)

## ADR-001 — Soft Delete é o padrão. Hard delete é proibido.

**Data:** 2026-05-15  
**Status:** Ativo  
**Contexto:** Sistema jurídico em produção. Histórico de processos, documentos e clientes é ativo permanente do escritório. Dados excluídos fisicamente podem ser requeridos em auditorias, recursos administrativos e ações judiciais.

### Princípio

> **Toda nova entidade criada no sistema nasce com suporte a soft delete.**  
> Hard delete é arquiteturalmente proibido em dados de negócio.

### Implementação padrão

Toda tabela de domínio deve incluir os 3 campos de arquivamento:

```sql
archived_at     TIMESTAMPTZ,    -- NULL = ativo; preenchido = arquivado
archived_by     UUID,           -- quem arquivou (user_id)
archive_reason  TEXT            -- motivo (texto livre, ex: "duplicidade", "cliente desistiu")
```

Toda query de listagem deve filtrar por padrão:

```sql
WHERE archived_at IS NULL
```

Filtro "incluir arquivados" é uma feature explícita, não o padrão.

### Cascata de arquivamento

Quando uma entidade pai é arquivada, entidades filhas devem ser arquivadas em cascata via trigger. Veja `018_p1_soft_delete_processos.sql` para implementação de referência.

Regra de reversão: ao desarquivar o pai, só revertem as filhas que foram arquivadas com o **mesmo timestamp** (cascata automática). Arquivamentos manuais independentes são preservados.

---

## Status de implementação por entidade

### Segue o padrão (archived_at / archived_by / archive_reason)

| Entidade | Tabela | Migration | Observações |
|---|---|---|---|
| Processos | `processos` | 018 | Trigger de cascata para 4 entidades filhas |
| Instituidores | `instituidores` | 014 | Entidade filha de processo |
| Dependentes Habilitados | `dependentes_habilitados` | 015 | Entidade filha de processo |
| Documentos de Processo | `documentos_processo` | 016 | Entidade filha de processo |
| Representações Legais | `representacoes_legais` | 017 | Entidade filha de processo |

### Padrão legado (deletado_em) — refatoração futura

| Entidade | Tabela | Campo atual | Pendência |
|---|---|---|---|
| Clientes | `clients` | `deletado_em` | Unificar com `archived_at/archived_by/archive_reason` |

### Sem soft delete — dívida arquitetural

| Entidade | Tabela | Prioridade | Observações |
|---|---|---|---|
| Prazos | `prazos` | Alta | Prazos perdidos são historicamente relevantes |
| Log de Prazos | `prazo_logs` | Baixa | É log de auditoria — imutável por natureza |

---

## ADR-002 — ON DELETE RESTRICT em FKs de processo

**Data:** 2026-05-15  
**Status:** Ativo

Todas as FKs para `processos(id)` usam `ON DELETE RESTRICT`. Como processos nunca são deletados fisicamente (ADR-001), esse constraint funciona como camada de segurança extra: se um bug tentar fazer DELETE físico de um processo, o banco rejeita com erro.

---

## ADR-003 — Separação de nomenclatura: arquivamento vs. exclusão lógica

**Data:** 2026-05-15  
**Status:** Ativo

| Padrão | Campo | Semântica | Usado em |
|---|---|---|---|
| Arquivamento auditável | `archived_at / archived_by / archive_reason` | Inativação com rastreabilidade de motivo e responsável | Processos, entidades filhas (Frente 3+) |
| Exclusão lógica simples | `deletado_em` | Inativação sem auditoria de motivo | Clientes (padrão legado) |

A unificação de `clients.deletado_em` para o padrão `archived_*` é pendência arquitetural a resolver em refatoração futura dedicada.

---

## ADR-004 — Multi-tenancy via tenant_id em todas as tabelas

**Data:** (anterior à Frente 3)  
**Status:** Ativo

Toda tabela de domínio inclui `tenant_id UUID NOT NULL REFERENCES tenants(id)`. O app usa a service key do Supabase (bypassa RLS), mas RLS está habilitado em todas as tabelas por consistência e defesa em profundidade. Queries de aplicação sempre filtram por `tenant_id` do usuário autenticado.

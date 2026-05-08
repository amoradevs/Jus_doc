# Fase 3 — Changelog

**Data de conclusão:** 2026-05-08
**Commits principais:** `13c6bb5` → `b926c77`

---

## Visão geral

A Fase 3 implementou dois blocos de trabalho sobre o sistema existente do escritório Rocha & Alencar Advocacia:

- **Bloco A** — Refatoração da interface Cliente × Processo: desacoplamento conceitual e visual entre a entidade-pessoa (Cliente) e a entidade-caso (Processo), criando navegação 1→N.
- **Bloco B** — Tracker de Prazos Processuais: sistema estruturado de prazos por processo, integrado ao Pipeline Kanban, agenda da home e sino de notificações.

---

## Bloco A — Cliente × Processo

### Adicionado

| Arquivo | Descrição |
|---------|-----------|
| `docs/migrations/010_processos_table.sql` | Criação da tabela `processos` com campos: `id`, `tenant_id`, `cliente_id`, `numero_interno`, `tipo_beneficio`, `etapa_pipeline`, `status_resultado`, `numero_protocolo_inss`, `numero_processo_judicial`, `data_entrada`, `dib_pleiteada`, `observacao_pipeline`, `created_at`, `updated_at`. Trigger `fn_numero_interno` gera o número sequencial `YYYY-NNNN`. Índices em `cliente_id`, `tenant_id`, `etapa_pipeline`. RLS habilitado. |
| `docs/migrations/011_migrate_clientes_to_processos.sql` | Migração dos dados existentes: para cada cliente com `tipo_beneficio` ou `status_resultado`, cria registro correspondente em `processos`. Preserva `etapa_pipeline`, `status_resultado`, `tipo_beneficio`. |
| `app/api/processos/route.ts` | `POST /api/processos` — cria novo processo vinculado a um cliente. Valida com `processoSchema`, verifica pertencimento ao tenant. Retorna `{ id, numero_interno }`. |
| `app/(app)/clientes/[id]/processos/novo/page.tsx` | Tela de criação de processo para um cliente específico. Server component com breadcrumb + formulário. |
| `app/(app)/processos/[numero_interno]/page.tsx` | Tela de detalhe do processo com URL própria. 4 abas: Resumo, Documentos, Prazos (Bloco B), Andamentos (stub). Header contextual com nome/CPF/telefone do cliente. |
| `components/processo-form.tsx` | Formulário de criação de processo (client component). Selects para tipo_beneficio, status_resultado, etapa_pipeline; date inputs; campos opcionais. |
| `lib/validators/schemas.ts` | Adicionado `processoSchema` e tipo `ProcessoInput`. |

### Modificado

| Arquivo | Mudança |
|---------|---------|
| `app/(app)/clientes/page.tsx` | Coluna "Status" substituída por "Processos". Novo componente `ProcessosBadge`: sem processo → cinza, 1 processo → tipo + badge de status colorido, 2+ → contador com indicador de prioridade (vermelho se algum indeferido, âmbar se exigência, verde se todos deferidos). Query adicional ao carregar a lista. |
| `app/(app)/clientes/[id]/page.tsx` | Adicionada seção "Processos" no topo da tela de detalhe do cliente, antes do checklist de documentos. Lista todos os processos do cliente com `numero_interno`, status badge e etapa. Botão "+ Novo processo". |
| `app/(app)/pipeline/page.tsx` | Cards do kanban agora representam Processos (não Clientes). Query atualizada para `processos` com join em `clients`. Drag-and-drop continua atualizando `etapa_pipeline` do processo. |
| `components/kanban-board.tsx` | Tipo `ProcessoCard` atualizado. Cards mostram `numero_interno` como identificador. Lógica de mover etapa intacta. |
| `app/(app)/page.tsx` | KPIs corrigidos para consultar tabela `processos` em vez de campos obsoletos de `clients`. |

### Removido

Nada foi removido. Os campos `tipo_beneficio`, `status_resultado` e `etapa_pipeline` da tabela `clients` foram esvaziados durante a migração, mas a coluna permanece por compatibilidade com código legado. Podem ser dropadas em uma migration futura quando confirmado que nenhuma rota ainda as lê.

---

## Bloco B — Tracker de Prazos Processuais

### Adicionado

| Arquivo | Descrição |
|---------|-----------|
| `docs/migrations/012_bloco_b_prazos.sql` | Tabela `prazos`: id, tenant_id, processo_id (FK CASCADE), categoria (enum: administrativo_inss, judicial, comercial_interno, evento), tipo (texto livre), descricao, data_inicio, data_limite, dias_uteis, status (enum: pendente, cumprido, perdido, cancelado), data_cumprimento, anotacao_cumprimento, created_by (UUID sem FK), created_at, updated_at. Trigger de updated_at. Tabela `prazo_logs`: audit trail de mudanças de status. RLS habilitado. **ATENÇÃO:** `created_by` e `user_id` são UUID sem FK para `auth.users` — projeto usa NextAuth com tabela `users` customizada, não Supabase Auth. |
| `config/feriados_nacionais.json` | Feriados nacionais fixos (9) + móveis 2026-2027 (Carnaval, Sexta Santa, Corpus Christi) + recesso forense (20/dez–20/jan). Arquivo de configuração externo — **editável sem redeployar** para adicionar feriados estaduais ou recessos especiais. |
| `lib/prazos/categorias.ts` | `CATEGORIAS_PRAZO`, `CategoriaPrazo`, `CATEGORIA_STYLE` (tokens Tailwind por categoria), `TIPOS_SUGERIDOS` (sugestões por categoria), `labelCategoria()`. |
| `lib/prazos/calcular-data-limite.ts` | `calcularDataLimite(dataInicio, dias, diasUteis)` — calcula data limite somando dias corridos ou úteis (excluindo fins de semana, feriados e recesso forense). `diasRestantes(dataLimite, hoje?, diasUteis?)` — retorna distância em dias, positivo/zero/negativo. Helpers exportados: `esFeriado`, `esRecessoForense`, `esDiaUtil`. |
| `lib/prazos/__tests__/calcular-data-limite.test.ts` | 28 testes Vitest cobrindo: prazo corrido, feriados fixos e móveis, recesso forense, dias úteis com cruzamento de feriado, carnaval, recesso forense. |
| `app/api/processos/[id]/prazos/route.ts` | `GET` — lista prazos do processo (auto-transição pendente→perdido para datas passadas + log); `POST` — cria novo prazo. |
| `app/api/prazos/[id]/cumprir/route.ts` | `PATCH` — marca prazo como cumprido, insere log. |
| `app/api/prazos/[id]/cancelar/route.ts` | `PATCH` — marca prazo como cancelado, insere log. |
| `app/api/prazos/urgentes/route.ts` | `GET` — retorna prazos pendentes com `data_limite ≤ hoje+2 dias`, ordenados por data e prioridade de categoria. Usado pelo sino de notificações. |
| `components/prazos/categoria-badge.tsx` | Badge visual por categoria usando tokens de `CATEGORIA_STYLE`. |
| `components/prazos/novo-prazo-modal.tsx` | Modal de cadastro: seletor de categoria (4 opções), sugestões rápidas por categoria, campo tipo (texto livre), data início + calculador de dias (recalcula data limite automaticamente), checkbox dias úteis, data limite manual, descrição opcional. |
| `components/prazos/cumprir-modal.tsx` | Modal de cumprimento: data de cumprimento (default hoje) + anotação opcional. Dispara `prazo-updated` após sucesso. |
| `components/prazos/lista-prazos.tsx` | Lista de prazos por processo com filtros (Todos/Pendentes/Cumpridos/Perdidos/Cancelados), badge `DiasRestantesBadge` com escala visual, ações "Marcar como cumprido" e "Cancelar". Dispara `prazo-updated` após cancelamento. |
| `components/notificacoes-sino.tsx` | Bell icon no header com badge de contagem de urgentes (≤48h), dropdown priorizado com link para processo, polling 5min, listener do evento `prazo-updated`. |

### Modificado

| Arquivo | Mudança |
|---------|---------|
| `app/(app)/processos/[numero_interno]/page.tsx` | Aba "Prazos" passou de stub para funcional: renderiza `<ListaPrazos processoId={processo.id} />`. |
| `app/(app)/pipeline/page.tsx` | Nova query de prazos pendentes por processo. Adiciona `proximo_prazo` e `tem_prazo_vencido` ao `enrichedProcessos`. |
| `components/kanban-board.tsx` | `ProcessoCard` estendido com `proximo_prazo` e `tem_prazo_vencido`. Novos componentes `PrazoBadge` e `getPrazoUrgencia`. Borda esquerda colorida por urgência (≤3d laranja, hoje/vencido vermelho). Background tintado para vencidos/hoje. ⚠ apenas para prazos já vencidos (não para hoje). |
| `app/api/agenda/route.ts` | Segunda query em `prazos` (categoria evento/comercial_interno, status pendente, dentro do período). Merge com eventos legados. Campos adicionais na resposta: `prazo_id`, `prazo_categoria`, `prazo_tipo`, `numero_interno`. |
| `components/dashboard/calendario-semanal.tsx` | `EventoAgenda` estendido com campos de prazo. `EventoDia` estendido com `prazoId`, `prazoCategoria`, `numeroInterno`. `EventoChip` adaptado: prazo estruturado → link para aba prazos do processo, sem botão de deletar; legado → comportamento original. Chips com cores teal/índigo para categorias de prazo. |
| `app/(app)/layout.tsx` | `<NotificacoesSino />` inserido entre `ThemeToggle` e separador/UserMenu. |

---

## Migrations aplicadas

Executar manualmente no Supabase SQL Editor (em ordem):

1. **`docs/migrations/010_processos_table.sql`** — cria tabela `processos` com trigger de número interno
2. **`docs/migrations/011_migrate_clientes_to_processos.sql`** — migra dados existentes
3. **`docs/migrations/012_bloco_b_prazos.sql`** — cria tabelas `prazos` e `prazo_logs`

**Hotfix aplicado em produção (não está em arquivo de migration):**
```sql
-- Remove FK incorreta para auth.users (projeto usa NextAuth + users customizada)
ALTER TABLE prazos DROP CONSTRAINT IF EXISTS prazos_created_by_fkey;
ALTER TABLE prazo_logs DROP CONSTRAINT IF EXISTS prazo_logs_user_id_fkey;
```
O arquivo `012_bloco_b_prazos.sql` já foi corrigido para refletir `UUID` sem FK.

---

## Bugs corrigidos na auditoria final

| Bug | Arquivo | Descrição |
|-----|---------|-----------|
| ⚠ aparecia para prazo de hoje | `components/kanban-board.tsx` | `dl <= hoje` corrigido para `dl < hoje` na condição do PrazoBadge. Spec: ⚠ apenas para vencido, não para hoje. |
| Loop infinito em diasRestantes | `lib/prazos/calcular-data-limite.ts` | Ao calcular dias úteis para datas passadas, o cursor avançava indefinidamente. Corrigido: itera sempre do menor para o maior, inverte sinal no retorno. |
| Import não usado | `components/notificacoes-sino.tsx` | `labelCategoria` importado mas não chamado. Removido. |

---

## Observações para o próximo desenvolvedor

### O que NÃO foi feito (escopo deliberado da Fase 3)

- **Notificações externas** (e-mail, WhatsApp, push) — deixadas para Fase 4. A spec é explícita nisto (seção 3.8).
- **Aba "Andamentos"** — stub implementado com estado "em breve". Escopo da Fase 4.
- **Feriados estaduais** — apenas nacionais em `config/feriados_nacionais.json`. O arquivo foi desenhado para suportar adição futura. As advogadas podem adicionar datas na seção `feriados_moveis`.
- **Criação de processo vinculada ao cadastro de cliente** — atualmente são duas etapas separadas. Poderia virar um wizard único na Fase 4.

### Trade-offs conhecidos

- **Background de urgência no Kanban** — spec pede "fundo tingido da cor da categoria" para prazos que vencem hoje. Implementado como `bg-destructive/[0.02]` (vermelho genérico) para ambos hoje e vencidos. Para usar a cor da categoria seria necessário passar o `CATEGORIA_STYLE[categoria].bg` como prop ou classe dinâmica — inviável com Tailwind purge sem safelist. Trade-off consciente.
- **Remoção de evento na agenda com processo compartilhado** — se um processo tem um evento legado E um prazo estruturado na mesma semana, deletar o evento legado remove ambos do estado local (mesma chave de deduplicação = processo_id). Borda improvável em produção, documentada para correção futura se necessário.
- **Coluna `tipo_beneficio` na tabela `clients`** — ainda existe mas está esvaziada após a migration. Drop seguro apenas quando confirmado que nenhuma rota/query lê diretamente da coluna de `clients`. Verificar antes de dropar.

### Feriados: como adicionar

Edite `config/feriados_nacionais.json`:
- Feriados fixos (toda data MM-DD): adicione em `feriados_fixos`
- Feriados móveis (data específica): adicione em `feriados_moveis`
- O recesso forense (20/dez–20/jan) é configurável em `recesso_forense`

Após editar, redeploy é necessário (o arquivo é lido em build time pelo Next.js).

### Padrão de auditoria de prazos

Toda mudança de status de prazo gera um registro em `prazo_logs`:
- `status_anterior` + `status_novo` + `user_id` + `anotacao` + `created_at`
- A auto-transição `pendente → perdido` também é logada (user_id = null)
- Para relatórios de auditoria: `SELECT * FROM prazo_logs WHERE prazo_id = ?`

### Evento DOM `prazo-updated`

`window.dispatchEvent(new CustomEvent('prazo-updated'))` é disparado ao marcar cumprido ou cancelar um prazo. O `NotificacoesSino` escuta este evento para rebuscar urgentes sem aguardar o próximo ciclo de polling (5min). Se no futuro outros componentes precisarem reagir a mudanças de prazo, basta adicionar o listener.

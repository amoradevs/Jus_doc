# Bloco 3 — Changelog

**Data de conclusão:** 2026-05-17  
**Commits:** `0eb0615` → `ba21e94`

---

## Visão geral

O Bloco 3 concentrou-se em qualidade, consistência de fluxo UX e ajustes solicitados pela advogada Dra. Lidiane Rocha Abreu:

- **Ajuste 1** — Exclusão de processos e clientes com confirmação por senha
- **Ajuste 2** — Checkboxes marcados com **(X)** em negrito em todos os documentos
- **Ajuste 3** — Escopo do modal de advogada corrigido: aparece apenas para Termo INSS; Contrato e Procuração sempre com ambas
- **Ajuste 4** — Modal de imóvel de terceiro: captura o nome do proprietário e preenche a Declaração de Residência automaticamente
- **Ajuste 5** — Termo de Responsabilidade reestruturado: dados da mãe e do cliente separados, assinatura correta, data por extenso
- **Ajuste 6** — Consistência de fluxo: busca rápida e wizard agora têm comportamento idêntico (parâmetros `advogadas` e `assinatura` propagados pela página de campos)

---

## Ajuste 1 — Exclusão de processo e cliente com confirmação por senha

### Problema
Não havia proteção contra exclusão acidental de registros importantes.

### Solução
Modal de confirmação por senha obrigatória antes de excluir qualquer processo ou cliente. A ação só é executada após validar a senha atual do usuário.

### Arquivos modificados
- Componentes de exclusão de processo e cliente
- API de validação de senha antes da deleção

---

## Ajuste 2 — Checkboxes com X em negrito

### Problema
Os checkboxes usavam símbolos Unicode (☑/☐) que aparecem mal formatados em alguns leitores de PDF e impressoras.

### Solução
Substituição pelo padrão `(X)` / `( )` em todos os documentos com checkbox:
- **Template 14** (Termo de Representação INSS): helper `pCheck()` — `(` normal + tag **negrito** + `)` normal
- **Template 15** (Termo de Responsabilidade): mesmo padrão na tabela de qualidade da representação
- **Contexto** (`template-context.ts`): campo `checkbox_X` retorna `'X'` (marcado) ou `' '` (espaço, desmarcado)

### Arquivos modificados
- [`scripts/generate-termo-representacao.mjs`](scripts/generate-termo-representacao.mjs)
- [`scripts/generate-termo-responsabilidade.mjs`](scripts/generate-termo-responsabilidade.mjs)
- [`lib/document-generation/template-context.ts`](lib/document-generation/template-context.ts)
- [`templates/14_termo_representacao_inss.docx`](templates/14_termo_representacao_inss.docx)
- [`templates/15_termo_responsabilidade.docx`](templates/15_termo_responsabilidade.docx)

---

## Ajuste 3 — Escopo do modal de advogada e Procuração com ambas

### Problema
O modal de seleção de advogada aparecia em contextos onde não faz sentido. Procuração e Contrato não estavam garantindo a presença das duas advogadas.

### Solução
- Modal abre **somente** quando o Termo de Representação INSS (código `05`) está no pacote — tanto no fluxo wizard quanto no fluxo de busca rápida
- `package-builder.ts`: override por categoria — templates de categoria `contrato` ou `procuracao` sempre recebem `mostrar_lidiane: true`, `mostrar_alcione: true`, `tem_duas_advogadas: true`, independentemente da seleção no modal
- Busca sem reset de seleção: removido `setSelected([])` do `onChange` da busca (bug que apagava a seleção ao digitar)
- Tutor Nato sempre marcado `'X'` no Termo de Responsabilidade (hardcoded — esse documento é sempre para menores)

### Arquivos modificados
- [`components/cenario-wizard/gerar-modo.tsx`](components/cenario-wizard/gerar-modo.tsx)
- [`components/cenario-wizard/step-confirmacao.tsx`](components/cenario-wizard/step-confirmacao.tsx)
- [`lib/document-generation/package-builder.ts`](lib/document-generation/package-builder.ts)
- [`lib/document-generation/template-context.ts`](lib/document-generation/template-context.ts)

---

## Ajuste 4 — Modal de imóvel de terceiro

### Problema
Ao selecionar o gatilho "imóvel de terceiro", o nome do proprietário não era capturado — a Declaração de Residência gerava com o campo em branco. O template 10 continha dados reais de cliente (sem tags dinâmicas).

### Solução
- **Modal UX**: ao marcar "imóvel de terceiro" no wizard, abre modal imediato pedindo o nome do proprietário. Suporte a Enter para confirmar. Cancelar → gatilho **não** é adicionado
- **Persistência**: PATCH `/api/clientes/${id}/contextual-data` com `{ imovel: { proprietario_nome, cedido: true } }` antes de adicionar o gatilho
- **Template 10 reconstruído**: script `generate-declaracao-residencia.mjs` gera `10_declaracao_residencia.docx` com todas as tags dinâmicas, blocos condicionais `{#bloco_mora_sozinho}` / `{#bloco_mora_com_dependentes}` e `{imovel.proprietario_nome}`

### Arquivos modificados/criados
- [`components/cenario-wizard/step-gatilhos.tsx`](components/cenario-wizard/step-gatilhos.tsx) — modal adicionado
- [`components/cenario-wizard/wizard-cenario.tsx`](components/cenario-wizard/wizard-cenario.tsx) — prop `clientId` passada ao StepGatilhos
- [`scripts/generate-declaracao-residencia.mjs`](scripts/generate-declaracao-residencia.mjs) — novo
- [`templates/10_declaracao_residencia.docx`](templates/10_declaracao_residencia.docx) — reconstruído

---

## Ajuste 5 — Termo de Responsabilidade reestruturado

### Problema
O Termo de Responsabilidade tinha estrutura incorreta: beneficiários em loop genérico, data no formato numérico (`dd/mm/aaaa`), assinatura com apenas o nome da mãe.

### Solução

**Tabela de beneficiários** — substituída por dois blocos fixos:
| Bloco | Conteúdo |
|-------|----------|
| Responsável (Representante) | `{representacao_legal.representante_nome}` + `{representacao_legal.representante_cpf}` |
| Beneficiário representado | `{cliente.nome_completo}` + `{cliente.cpf}` |

**Data** — formato por extenso (`17 de maio de 2026`) igual aos demais documentos

**Assinatura** — linha + nome e CPF do cliente em fonte menor (9pt) + nome e CPF da mãe em negrito, sem espaço entre as linhas

### Arquivos modificados
- [`scripts/generate-termo-responsabilidade.mjs`](scripts/generate-termo-responsabilidade.mjs)
- [`templates/15_termo_responsabilidade.docx`](templates/15_termo_responsabilidade.docx)

---

## Ajuste 6 — Consistência de fluxo: busca vs. wizard

### Problema
Os parâmetros `advogadas` e `assinatura` escolhidos no modal (fluxo de busca rápida) eram perdidos ao passar pela página de campos intermediária (`/gerar/campos`). O resultado final usava os valores padrão (`ambas` / `true`) em vez dos escolhidos pela advogada.

### Solução
A página de campos agora lê, repassa e preserva `advogadas` e `assinatura` em todo o caminho:
- No redirect direto (sem campos faltando) → URL inclui os params
- No `ContextualFieldsForm` (com campos faltando) → navegação para resultado inclui os params

**Fluxo corrigido:**
```
busca → confirma advogada → /gerar/campos?...&advogadas=lidiane&assinatura=1
                                    ↓ (preserva params)
                            /gerar/resultado?...&advogadas=lidiane&assinatura=1
```

### Arquivos modificados
- [`app/(app)/clientes/[id]/gerar/campos/page.tsx`](app/(app)/clientes/[id]/gerar/campos/page.tsx)
- [`components/contextual-fields-form.tsx`](components/contextual-fields-form.tsx)

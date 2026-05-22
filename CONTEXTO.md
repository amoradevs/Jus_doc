# CONTEXTO.md — JusDoc · Rocha & Alencar Advocacia

> Arquivo de orientação para novas sessões de desenvolvimento. Denso por design.

---

## 1. O que é e para quem

Sistema web privado de gestão e geração de documentos jurídicos para o escritório **Rocha & Alencar Advocacia**, Fortaleza/CE.

**Usuárias:** Dra. Lidiane Rocha Abreu (advogada principal, adv1) e Dra. Alcione (parceira, adv2). Acesso por login com senha; sem auto-cadastro público.

**Função central:** dado um cliente e um cenário (benefício previdenciário + perfil + gatilhos), o sistema monta o pacote documental correto, substitui variáveis nos templates DOCX/PDF, converte para PDF e entrega como ZIP para download.

**Domínio:** benefícios do INSS — BPC/LOAS, Aposentadoria por Idade, Pensão por Morte, Mandado de Segurança. Clientes com perfis: adulto capaz, a rogo, menor impúbere (<16), menor púbere (16–18), incapaz com curador.

---

## 2. Stack e estrutura de pastas

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 14 App Router (TypeScript) |
| Estilo | Tailwind CSS v3 + shadcn/ui |
| Banco | Supabase (PostgreSQL) + Storage (arquivos) |
| Auth | NextAuth (tabela `users` customizada — **não** Supabase Auth) |
| PDF gerado | pdf-lib (template 05, renderer customizado) |
| DOCX gerado | docxtemplater + pizzip |
| DOCX → PDF | LibreOffice headless (verificado em runtime com `isPdfConverterAvailable()`) |
| ZIP de entrega | JSZip |
| Motor de prazos | Vitest (28 testes) |

```
app/
├── (app)/          # Rotas autenticadas
│   ├── clientes/   # CRUD de clientes + fluxo de geração
│   ├── processos/  # Detalhe de processo, prazos, andamentos
│   ├── pipeline/   # Kanban de etapas
│   └── configuracoes/
├── (auth)/         # Login
└── api/
    ├── geracao/    # POST — gera pacote documental
    ├── download/   # GET — baixa PDF ou DOCX por packageId+codigo
    ├── processos/  # CRUD + prazos
    ├── clientes/   # CRUD
    ├── prazos/     # cumprir, cancelar, urgentes
    └── ...

lib/
├── document-generation/
│   ├── cadeia-documental.ts         # Motor de montagem de pacotes
│   ├── template-context.ts          # buildTemplateContext() — resolve todos os campos
│   ├── contextual-fields-resolver.ts # Campos extras (representante legal, cônjuge, MEI etc.)
│   ├── package-builder.ts           # Orquestra geração + upload Storage + ZIP
│   ├── docx-renderer.ts             # Aplica variáveis DocxTemplater em buffer DOCX
│   ├── render-termo-representacao-inss.ts  # Renderer PDF customizado (template 05)
│   ├── pdf-converter.ts             # LibreOffice headless wrapper
│   ├── pdf-overlay.ts               # PDF overlay para formulários legados
│   └── html-to-pdf.ts
├── prazos/
│   ├── calcular-data-limite.ts      # Dias corridos/úteis com feriados e recesso forense
│   └── __tests__/
├── db/index.ts                      # Supabase service client (SUPABASE_SERVICE_KEY)
└── auth.ts / auth-helpers.ts        # NextAuth config

templates/                           # Arquivos .docx e .png físicos no repo
├── 01_contrato_bpc_adulto.docx
├── 02_contrato_bpc_a_rogo.docx
├── 03_contrato_bpc_menor_16.docx    # ← BUG: falta representante legal
├── 04_contrato_bpc_menor_16_a_18.docx # ← BUG: falta representante legal
├── 05_procuracao_bpc_adulto.docx
├── ... (até 15_termo_responsabilidade.docx)
├── brasao-republica.png             # Brasão extraído via PyMuPDF — usado no template 05
└── assinaturas/lidiane.png          # Assinatura digital da Dra. Lidiane

config/
└── feriados_nacionais.json          # Feriados nacionais + recesso forense (editável sem redeploy)

scripts/
├── generate-termo-representacao.mjs   # Gera template 14 via docx lib
└── generate-termo-responsabilidade.mjs
```

---

## 3. Decisões arquiteturais tomadas

| Decisão | Motivo |
|---------|--------|
| Template 05 é PDF puro (pdf-lib), não DOCX | Formulário oficial do INSS tem layout pixel-perfect que DOCX não reproduz fielmente |
| Motor de cadeia documental é código TypeScript puro (hardcoded) | Velocidade de implementação; spec prevê migrar para tabela Supabase futuramente |
| Templates DOCX de produção vivem no Supabase Storage, não no repo | `package-builder.ts` lê `storage_path` da tabela `document_templates`; se preenchido, baixa do bucket `templates`. Editar arquivos no repo **não afeta produção** — fazer upload direto ao Storage |
| Soft delete obrigatório em todas as entidades de negócio (`archived_at`, `archived_by`, `archive_reason`) | Dados jurídicos são ativos permanentes; hard delete é proibido (ADR-001) |
| FKs de processo com `ON DELETE RESTRICT` | Camada de segurança extra caso bug tente delete físico (ADR-002) |
| NextAuth, não Supabase Auth | Sistema legado; tabela `users` customizada. FKs para `auth.users` não existem — usar `UUID` sem FK |
| Contrato e Procuração (categorias) sempre geram com ambas advogadas | Regra de negócio fixa; modal de seleção se aplica apenas ao Termo INSS |
| DOCX salvo no Storage ao lado do PDF | Advogada precisa editar antes de assinar |
| Checkboxes como `(X)` / `( )` em negrito, não Unicode | Impressão e leitores de PDF rendem corretamente; Unicode fragmenta em alguns drivers |
| `drawJustified()` implementado manualmente | pdf-lib não tem justificação nativa |
| Texto de identificação no Termo INSS é parágrafo único contínuo | Reproduz exatamente o formulário oficial do INSS — campo a campo isolado é incorreto |

---

## 4. Convenções de código

- **Sem comentários descritivos** — nomes dos identificadores comunicam o que; comentários só para invariantes não óbvias.
- **Todas as datas ISO** convertidas para `pt-BR` em `formatarData()` — nunca exibir ISO bruto.
- **CPF e CEP** formatados via `formatarCPF()` / `formatarCEP()` no `buildTemplateContext()` — chegam formatados no contexto; templates não formatam.
- **Campos de gênero** neutralizados com sufixo `(a)` via `neutralizar()` — ex: `divorciado(a)`.
- **`checkbox_X`** retorna `'X'` (marcado) ou `' '` (espaço) — `isChecked()` verifica `val === 'X' || val === 'x'`.
- **Geração de documentos** sempre passa pelo `buildTemplateContext()` antes de qualquer renderer — não construir contextos ad hoc.
- **Rotas de API** retornam `{ error: { code, message } }` em erros — nunca string crua.
- **Soft delete** em qualquer nova tabela de domínio: `archived_at TIMESTAMPTZ`, `archived_by UUID`, `archive_reason TEXT`. Query padrão filtra `IS NULL`.

---

## 5. O que está implementado e funcionando

### Geração de documentos
- Motor de cadeia documental (`cadeia-documental.ts`) — mapeia benefício + perfil + gatilhos → lista de templates na ordem canônica
- Templates DOCX com condicionais DocxTemplater (advogadas, checkboxes, representante legal, cônjuge, MEI, imóvel de terceiro)
- Template 05 — Termo de Representação INSS: PDF pixel-perfect com pdf-lib, brasão da República, texto justificado, tabela de 8 checkboxes, duas assinaturas
- Declaração de Hipossuficiência (código 03) inclusa em **todos os tipos de ação** — `beneficios: []` em `cadeia-documental.ts`
- Assinatura digital da Dra. Lidiane **sempre ativa** no Termo INSS — `incluir_assinatura_lidiane` hardcoded como `true`; toggle removido do wizard
- ZIP "Baixar todos" inclui **PDF e DOCX** de cada documento (templates DOCX convertidos para PDF incluem ambos os formatos no mesmo ZIP)
- Download em PDF e DOCX por documento individual; ZIP do pacote completo
- Modal de seleção de advogada antes de gerar (wizard e busca rápida) — define qual assina o Termo INSS; Contrato e Procuração sempre saem com as duas
- Contrato de honorários (`01_01_contrato_honorarios.docx`): RG do representante condicional em dois blocos — cabeçalho (`{#representante.rg}, RG: ...{/representante.rg}` inline) e assinatura (parágrafo envolvido por tags de bloco); some completamente quando vazio
- Histórico de documentos gerados: botão de exclusão por pacote com diálogo de confirmação — remove registro do banco e ZIP do Storage (`DELETE /api/geracao/[packageId]`)

### Wizard de cenário (4 steps)
- Step 2 (Perfil): hint visual inline quando menor/incapaz selecionado — informa que representante legal será exigido
- Step 3 (Gatilhos): auto-seleção de `tem_representacao_legal` para perfis menores/incapazes + badge "Necessário para este perfil"
- Step 3 (Gatilhos): subformulário inline de representante legal aparece quando gatilho ativo — coleta nome completo, CPF (validado com dígito verificador), RG (opcional) e parentesco (select: Genitora/Genitor/Tutora/Tutor/Curadora/Curador); salva via PATCH antes de avançar
- Validação de CPF com algoritmo de dígito verificador nos dois contextos: cliente principal e representante legal

### Gestão de clientes e processos
- CRUD completo de clientes com soft delete
- Processos desacoplados de clientes (1 cliente → N processos), numeração `YYYY-NNNN`
- Pipeline Kanban com drag-and-drop por etapa
- Tracker de prazos processuais (administrativo, judicial, comercial, evento) com cálculo de dias úteis/corridos, feriados nacionais, recesso forense
- Exclusão de pacotes gerados pela advogada diretamente no portal (hard delete — pacote de teste não polui o histórico do cliente)

### Infraestrutura
- Soft delete em processos com cascata para 4 entidades filhas (trigger SQL)
- 18+ migrations aplicadas no Supabase
- Sino de notificações para prazos urgentes (≤48h), polling 5min
- Exclusão protegida por confirmação de senha

---

## 6. O que está pendente (por prioridade)

### Alta prioridade
1. **Template 07 da Declaração de Inatividade de MEI (código 07)** — ainda não cadastrado no DB. Motor gera aviso `MEI_TEMPLATE_AUSENTE` quando o gatilho é ativado. Precisa do arquivo DOCX e cadastro na tabela `document_templates`.

### Média prioridade
3. **Aba "Andamentos" no detalhe do processo** — stub implementado com estado "em breve". Escopo da Fase 4.
4. **Notificações externas** (e-mail / WhatsApp) para prazos urgentes — spec menciona para Fase 4.
5. **Wizard unificado de cadastro de cliente + processo** — atualmente são duas etapas separadas.

### Baixa prioridade / dívida técnica
6. **Coluna `tipo_beneficio` em `clients`** — esvaziada na migration 011, mas não dropada. Verificar que nenhuma rota lê antes de dropar.
7. **Campo `deletado_em` em `clients`** — padrão legado; unificar com `archived_at/archived_by/archive_reason`.
8. **Soft delete em `prazos`** — prazos perdidos são historicamente relevantes; coluna `archived_at` não existe ainda.
9. **Catálogo de templates migrar para Supabase** — atualmente hardcoded em `cadeia-documental.ts`. Motor não muda, só a fonte de dados.
10. **Feriados estaduais** — `config/feriados_nacionais.json` só tem nacionais; adicionar feriados do CE se necessário.

---

## 7. Bugs conhecidos

### BUG-01 — Representante legal ausente nos contratos de menores (templates 03 e 04) ✅ RESOLVIDO COMPLETAMENTE

**Sintoma original:** Templates 03 e 04 geravam sem os dados do representante legal (nome, CPF, RG, parentesco) — cabeçalho com `"Representado(a) por seu(sua) (CPF: , RG: )"` e assinatura com nome da menor seguido de rótulos vazios.

**Causa raiz (camada 1 — chave errada):** `contextual-fields-form.tsx` gravava o nome com a chave `nome` → `{ "nome": "Maria Silva" }`. `buildTemplateContext()` lia `nome_completo` → sempre `''`. **Correção (2026-05-20):** chave alterada de `'nome'` para `'nome_completo'` na linha 71.

**Causa raiz (camada 2 — dado nunca coletado no wizard):** O fluxo wizard nunca exibia o formulário de campos contextuais (`contextual-fields-form.tsx`), que só existe na busca rápida. Para qualquer cliente menor gerado pelo wizard, `representante_legal` era `null` no banco. **Correção (2026-05-20):** subformulário inline adicionado no Step 3 (Gatilhos) — aparece quando `tem_representacao_legal` está ativo e salva via PATCH antes de avançar.

**Invariante documentada:** o campo de nome do representante deve sempre usar a chave `nome_completo` em todas as camadas — formulário contextual, PATCH payload, `buildTemplateContext()` e placeholders `{representante.nome_completo}` dos templates 03, 04, 06, 07. Nunca usar `nome`.

---

## 8. Próximo passo lógico de desenvolvimento

**Imediato:** Implementar o template 07 (Declaração de Inatividade de MEI) — criar o arquivo DOCX, cadastrar na tabela `document_templates` com `campos_contextuais_necessarios = ['empresa_mei']` e testar o fluxo completo com o gatilho `mei_inativo`.

**UX — wizard:** O subformulário de representante legal (Step 3) não pré-carrega dados existentes do banco. Se a advogada voltar e avançar novamente, os campos estarão vazios mas o PATCH sobrescreve corretamente. Melhoria futura: carregar dados existentes ao montar o componente.

---

## Referências rápidas

| Arquivo | O que é |
|---------|---------|
| `ARCHITECTURE.md` | ADRs formais (soft delete, FKs, nomenclatura) |
| `BLOCO_1_CHANGELOG.md` | Download DOCX, parágrafos vazios, hipossuficiência |
| `BLOCO_2_CHANGELOG.md` | Termo INSS reescrito, condicionais de advogada, modal de seleção |
| `BLOCO_3_CHANGELOG.md` | Soft delete com senha, checkboxes (X), modal imóvel, Termo Responsabilidade |
| `FASE_3_CHANGELOG.md` | Desacoplamento Cliente×Processo, Tracker de Prazos |
| `lib/document-generation/cadeia-documental.ts` | Catálogo de templates + motor de montagem de pacotes |
| `lib/document-generation/template-context.ts` | `buildTemplateContext()` — fonte de todos os campos dos documentos |
| `lib/document-generation/render-termo-representacao-inss.ts` | Renderer PDF do Termo INSS (template 05) |
| `config/feriados_nacionais.json` | Feriados e recesso forense (editável sem redeploy) |

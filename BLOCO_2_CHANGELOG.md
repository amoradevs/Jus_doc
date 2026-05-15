# Bloco 2 — Changelog

**Data de conclusão:** 2026-05-15  
**Commits principais:** `fbbbf78` → `d4519e4`

---

## Visão geral

O Bloco 2 implementou a segunda rodada de ajustes e novas funcionalidades sobre o sistema de geração de documentos:

- **Ajuste 1** — Gerador do Termo de Representação INSS reescrito como DOCX nativo com tabela de 2 colunas sem bordas para assinaturas duplas.
- **Ajuste 2** — Condicionais de advogada em todos os templates (01–08): documentos agora personalizam nomes, CPF e OAB conforme a advogada selecionada.
- **Ajuste 3** — Modal de seleção de advogada antes de gerar documentos (fluxo wizard).
- **Ajuste 4** — Remoção de texto em vermelho no template de Declaração de Hipossuficiência.
- **Ajuste 5** — Assinatura digital da Dra. Lidiane embutida como imagem PNG no Termo de Representação INSS.
- **Ajuste 6** — Modal de seleção de advogada adicionado ao fluxo de busca rápida (gerar-modo), tornando os dois fluxos consistentes.

---

## Ajuste 1 — Termo de Representação INSS (template 14) reescrito

### Problema
O template 14 era gerado em formato legado sem condicionais de advogada. O layout de assinaturas duplas (Lidiane + Alcione) ficava em coluna única, desalinhado.

### Solução
Template completamente reescrito via script Node.js (`scripts/generate-termo-representacao.mjs`) usando a biblioteca `docx`. Mudanças principais:

- **Tabela de 2 colunas sem bordas** (`sig2col()`) para layout de assinaturas lado a lado, fixada em `9638 twips` (A4 com margens 2cm laterais). Bordas removidas via pós-processamento OOXML com PizZip.
- **Condicionais DocxTemplater** para blocos de advogada: `{#tem_duas_advogadas}` / `{^tem_duas_advogadas}` + `{#mostrar_lidiane}` / `{#mostrar_alcione}`.
- **Espaçamento padronizado:** Arial 11pt, 1.15 de entrelinha, 4pt entre parágrafos, margens 1,5cm sup/inf e 2cm laterais.
- Lista de benefícios com checkboxes (`{checkbox.*}`), cidade e data dinâmicas, termo de responsabilidade e Código Penal compactados em 9pt.

### Arquivos modificados
- [scripts/generate-termo-representacao.mjs](scripts/generate-termo-representacao.mjs) — reescrita completa; gera o template
- [templates/14_termo_representacao_inss.docx](templates/14_termo_representacao_inss.docx) — recriado pelo script

---

## Ajuste 2 — Condicionais de advogada nos documentos (templates 01–08)

### Problema
Os templates de contrato e procuração (01–08) tinham nomes das advogadas hardcoded. Não era possível gerar documentos com apenas uma das advogadas ou trocar a combinação.

### Solução
Templates atualizados com bloco condicional DocxTemplater:
```
{#tem_duas_advogadas}...{/tem_duas_advogadas}
{^tem_duas_advogadas}{#mostrar_lidiane}...{/mostrar_lidiane}{#mostrar_alcione}...{/mostrar_alcione}{/tem_duas_advogadas}
```

O `buildTemplateContext()` popula os booleanos `tem_duas_advogadas`, `mostrar_lidiane`, `mostrar_alcione` com base no parâmetro `advogadas_selecionadas` recebido da API.

Adicionalmente, o `processoId` foi encadeado por toda a pilha de geração para que os checkboxes do Termo de Representação sejam preenchidos automaticamente com o tipo de benefício do processo vinculado.

### Arquivos modificados
- [templates/01_contrato_honorarios_inss.docx](templates/01_contrato_honorarios_inss.docx) — condicionais de advogada
- [templates/02_contrato_honorarios_ms.docx](templates/02_contrato_honorarios_ms.docx) — condicionais de advogada
- [templates/03_contrato_honorarios_loas.docx](templates/03_contrato_honorarios_loas.docx) — condicionais de advogada
- [templates/04_contrato_honorarios_administrativo.docx](templates/04_contrato_honorarios_administrativo.docx) — condicionais de advogada
- [templates/05_procuracao_bpc_adulto.docx](templates/05_procuracao_bpc_adulto.docx) — condicionais de advogada
- [templates/06_procuracao_bpc_menor_16.docx](templates/06_procuracao_bpc_menor_16.docx) — condicionais de advogada
- [templates/07_procuracao_bpc_16_a_18.docx](templates/07_procuracao_bpc_16_a_18.docx) — condicionais de advogada
- [templates/08_procuracao_mandado_seguranca.docx](templates/08_procuracao_mandado_seguranca.docx) — condicionais de advogada
- [lib/document-generation/template-context.ts](lib/document-generation/template-context.ts) — `buildTemplateContext()` recebe `advogadas_selecionadas` e popula booleanos; campo `adv1_cpf` e `adv2_cpf` adicionados; parâmetro `incluirAssinaturaLidiane`
- [lib/document-generation/package-builder.ts](lib/document-generation/package-builder.ts) — passa `advogadas_selecionadas` e `incluirAssinaturaLidiane` para `buildTemplateContext()`
- [app/api/geracao/route.ts](app/api/geracao/route.ts) — lê `advogadas_selecionadas`, `incluir_assinatura_lidiane` e `processoId` do body; repassa para `buildDocumentPackage()`
- [app/(app)/clientes/[id]/gerar/resultado/page.tsx](app/%28app%29/clientes/%5Bid%5D/gerar/resultado/page.tsx) — `gerar()` lê `advogadas` e `assinatura` dos query params da URL

### Campos adicionados em configurações
- [app/api/configuracoes/route.ts](app/api/configuracoes/route.ts) — inclui `adv1_cpf` e `adv2_cpf` na resposta
- [app/(app)/configuracoes/page.tsx](app/%28app%29/configuracoes/page.tsx) — campos "CPF" para Advogada 1 e Advogada 2 no formulário
- [docs/migrations/013_advogada_cpf.sql](docs/migrations/013_advogada_cpf.sql) *(novo)* — adiciona colunas `adv1_cpf` e `adv2_cpf` em `office_settings`

---

## Ajuste 3 — Modal de seleção de advogada (fluxo wizard)

### Problema
Ao clicar "Gerar documentos" no wizard, o sistema gerava sempre com ambas as advogadas, sem perguntar. Não havia forma de gerar com apenas uma delas.

### Solução
Modal de confirmação adicionado ao `StepConfirmacao` (último passo do wizard). Antes de enviar para a API, o modal exibe:
- **RadioGroup** com três opções: Ambas (Lidiane e Alcione) / Apenas Lidiane / Apenas Alcione
- **Checkbox** "Incluir assinatura digital da Dra. Lidiane" — visível apenas quando Lidiane está selecionada. Afeta apenas o Termo de Representação INSS.

### Arquivos modificados
- [components/cenario-wizard/step-confirmacao.tsx](components/cenario-wizard/step-confirmacao.tsx) — modal com `RadioGroup` + checkbox condicional; `advogadasSelecionadas` e `incluirAssinaturaLidiane` enviados no body do fetch para `/api/geracao`

---

## Ajuste 4 — Remoção de texto em vermelho na Declaração de Hipossuficiência

### Problema
O template `09_declaracao_hipossuficiencia.docx` renderizava texto em vermelho (`<w:color w:val="FF0000"/>`) em 7 runs, tanto em visualizações web quanto no documento impresso.

### Solução
Remoção das 7 ocorrências de `<w:color w:val="FF0000"/>` via pós-processamento OOXML com PizZip. O texto volta à cor padrão do documento (preto).

### Arquivos modificados
- [templates/09_declaracao_hipossuficiencia.docx](templates/09_declaracao_hipossuficiencia.docx) — 7 ocorrências de `w:color="FF0000"` removidas

---

## Ajuste 5 — Assinatura digital da Dra. Lidiane no Termo de Representação

### Problema
O Termo de Representação INSS (template 14) precisava embutir a assinatura digital da Dra. Lidiane como imagem PNG — funcionalidade nova, não existia antes.

### Solução
Módulo `docxtemplater-image-module-free` integrado ao renderer. Uma **nova instância** do módulo é criada por render (factory `makeImageModule()`) para evitar o erro `"Cannot attach a module that was already attached"`.

O template 14 foi reconstruído com blocos condicionais:
```
{#incluir_assinatura_lidiane}
{%escritorio.adv1_assinatura_path}    ← imagem PNG embarcada
{/incluir_assinatura_lidiane}
{^incluir_assinatura_lidiane}
_________________________             ← linha manual se desabilitado
{/incluir_assinatura_lidiane}
```

O caminho da imagem `templates/assinaturas/lidiane.png` é resolvido em runtime com `path.resolve(process.cwd(), tagValue)` — sem armazenar no Supabase Storage. A assinatura é embarcada como parte do DOCX gerado.

O `next.config.ts` foi atualizado para:
- Incluir `templates/assinaturas/` no bundle serverless via `outputFileTracingIncludes`
- Declarar `docxtemplater-image-module-free` em `serverExternalPackages` (módulo CJS puro)

### Arquivos modificados/criados
- [templates/assinaturas/lidiane.png](templates/assinaturas/lidiane.png) *(novo)* — assinatura da Dra. Lidiane, 600px de largura, fundo transparente, 69 KB
- [templates/14_termo_representacao_inss.docx](templates/14_termo_representacao_inss.docx) — recriado com blocos de imagem condicional
- [lib/document-generation/docx-renderer.ts](lib/document-generation/docx-renderer.ts) — factory `makeImageModule()`, `modules: [makeImageModule()]` em todas as instâncias Docxtemplater
- [lib/document-generation/template-context.ts](lib/document-generation/template-context.ts) — campos adicionados ao tipo `TemplateContext`: `incluir_assinatura_lidiane: boolean`, `adv1_assinatura_path: string` (dentro de `escritorio`), `apenas_lidiane: boolean`, `apenas_alcione: boolean`
- [next.config.ts](next.config.ts) — `serverExternalPackages` e `outputFileTracingIncludes` para templates

---

## Ajuste 6 — Modal de advogada no fluxo de busca rápida

### Problema
A busca rápida de documentos (`GerarModo`) navegava diretamente para `/gerar/campos` sem perguntar sobre a advogada. Os dois fluxos de geração (wizard e busca) tinham comportamento inconsistente.

### Solução
Modal de seleção de advogada adicionado ao componente `GerarModo`. O fluxo ficou:
1. Usuário seleciona documentos na busca
2. Clica "Gerar Documento" ou "Revisar antes"
3. Modal exibe opções de advogada + checkbox de assinatura Lidiane
4. Ao confirmar, navega para `/gerar/campos` com query params: `&advogadas=ambas&assinatura=1`

### Arquivos modificados
- [components/cenario-wizard/gerar-modo.tsx](components/cenario-wizard/gerar-modo.tsx) — estados `modalAberto`, `pendingModo`, `advogadasSelecionadas`, `incluirAssinaturaLidiane`; `continuar()` abre modal; `confirmar()` navega com params; UI do modal idêntica ao step-confirmacao

---

## Resumo de arquivos

| Arquivo | Tipo | Ajuste |
|---------|------|--------|
| `scripts/generate-termo-representacao.mjs` | Modificado | 1 |
| `templates/14_termo_representacao_inss.docx` | Recriado | 1, 5 |
| `templates/01_contrato_honorarios_inss.docx` | Modificado | 2 |
| `templates/02_contrato_honorarios_ms.docx` | Modificado | 2 |
| `templates/03_contrato_honorarios_loas.docx` | Modificado | 2 |
| `templates/04_contrato_honorarios_administrativo.docx` | Modificado | 2 |
| `templates/05_procuracao_bpc_adulto.docx` | Modificado | 2 |
| `templates/06_procuracao_bpc_menor_16.docx` | Modificado | 2 |
| `templates/07_procuracao_bpc_16_a_18.docx` | Modificado | 2 |
| `templates/08_procuracao_mandado_seguranca.docx` | Modificado | 2 |
| `templates/09_declaracao_hipossuficiencia.docx` | Modificado | 4 |
| `templates/assinaturas/lidiane.png` | Novo | 5 |
| `lib/document-generation/template-context.ts` | Modificado | 2, 5 |
| `lib/document-generation/docx-renderer.ts` | Modificado | 5 |
| `lib/document-generation/package-builder.ts` | Modificado | 2 |
| `app/api/geracao/route.ts` | Modificado | 2 |
| `app/api/configuracoes/route.ts` | Modificado | 2 |
| `app/(app)/clientes/[id]/gerar/resultado/page.tsx` | Modificado | 2 |
| `app/(app)/configuracoes/page.tsx` | Modificado | 2 |
| `components/cenario-wizard/step-confirmacao.tsx` | Modificado | 3 |
| `components/cenario-wizard/gerar-modo.tsx` | Modificado | 6 |
| `next.config.ts` | Modificado | 5 |
| `docs/migrations/013_advogada_cpf.sql` | Novo | 2 |

---

## Observações para o próximo desenvolvedor

### Convenção adv1 / adv2

**adv1 = Dra. Lidiane (advogada principal)**  
**adv2 = Dra. Alcione (advogada parceira)**

Esta convenção é usada em toda a pilha: tabela `office_settings`, `buildTemplateContext()`, tags nos templates e assinatura digital. Não inverter.

### Módulo de imagem: instância por render

`docxtemplater-image-module-free` **não pode** ser compartilhado entre instâncias de `Docxtemplater`. A factory `makeImageModule()` em `docx-renderer.ts` cria uma instância nova a cada chamada. Se no futuro houver refatoração do renderer para pool de workers, garantir que cada worker tem sua própria instância.

### Assinatura digital: localização do arquivo

`templates/assinaturas/lidiane.png` é lido em runtime com `path.resolve(process.cwd(), tagValue)`. O `outputFileTracingIncludes` em `next.config.ts` garante que o arquivo está no bundle serverless do Vercel. Para adicionar assinatura da Alcione no futuro: (1) adicionar PNG em `templates/assinaturas/alcione.png`, (2) adicionar `adv2_assinatura_path` em `TemplateContext`, (3) atualizar `buildTemplateContext()` para popular o campo, (4) atualizar templates que precisam da assinatura da Alcione.

### Aba Andamentos

A aba "Andamentos" no detalhe do processo está como stub. A implementação foi adiada até decisão do escritório sobre o fluxo desejado (registro manual vs. integração com sistema do INSS). Não implementar sem validar com a cliente primeiro.

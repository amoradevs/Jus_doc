# Bloco 1 — Changelog

**Data:** 13/05/2026  
**Referência:** Feedback da Dra. Alcione — primeira rodada de ajustes pós-entrega

---

## Ajuste 1 — Botão de download em Word (.docx) além do PDF

### Problema
O sistema gerava apenas PDF para download. A advogada precisava editar os documentos antes de assinar.

### Solução
Ao gerar o pacote de documentos, o buffer DOCX é agora preservado e salvo no Supabase Storage ao lado do PDF. Dois novos pontos de download foram adicionados à interface.

### Arquivos modificados
- [lib/document-generation/package-builder.ts](lib/document-generation/package-builder.ts) — hoisting do `docxBuffer`, upload do DOCX para Storage após criação do pacote
- [app/api/download/[packageId]/docx/[codigo]/route.ts](app/api/download/%5BpackageId%5D/docx/%5Bcodigo%5D/route.ts) *(novo)* — endpoint de download do DOCX com `Content-Disposition: attachment`
- [app/(app)/clientes/[id]/gerar/resultado/page.tsx](app/%28app%29/clientes/%5Bid%5D/gerar/resultado/page.tsx) — botão "Word" adicionado ao lado de "PDF" na tela de resultado
- [app/(app)/clientes/[id]/page.tsx](app/%28app%29/clientes/%5Bid%5D/page.tsx) — pacotes listados com dois botões: "Ver docs" e "Baixar ZIP"

---

## Ajuste 2 — Remoção de parágrafos vazios duplos nas procurações

### Problema
Procurações 05, 06, 07 e 08 tinham dois parágrafos vazios consecutivos entre blocos e ao final do documento, causando excesso de espaçamento na impressão.

### Regra aplicada
Grupos de 2+ parágrafos vazios consecutivos reduzidos a 1. Parágrafos vazios ao final do documento removidos inteiramente.

### Arquivos modificados
- [templates/05_procuracao_bpc_adulto.docx](templates/05_procuracao_bpc_adulto.docx) — 13 → 8 parágrafos (−5)
- [templates/06_procuracao_bpc_menor_16.docx](templates/06_procuracao_bpc_menor_16.docx) — 17 → 11 parágrafos (−6)
- [templates/07_procuracao_bpc_16_a_18.docx](templates/07_procuracao_bpc_16_a_18.docx) — 17 → 11 parágrafos (−6)
- [templates/08_procuracao_mandado_seguranca.docx](templates/08_procuracao_mandado_seguranca.docx) — 12 → 8 parágrafos (−4)

---

## Ajuste 3 — Remoção de "e de minha família" na Declaração de Hipossuficiência

### Problema
O template 09 continha a expressão "e de minha família" que não reflete a realidade de todos os casos, pois o cliente pode ser solteiro ou não sustentar família.

### Solução
Remoção do run XML isolado com `rsidRPr="00A02637"` que continha a expressão, mantendo a pontuação e o fluxo do texto intactos.

**Antes:** `...sem prejuízo do meu próprio sustento e de minha família, sendo, pois...`  
**Depois:** `...sem prejuízo do meu próprio sustento, sendo, pois...`

### Arquivos modificados
- [templates/09_declaracao_hipossuficiencia.docx](templates/09_declaracao_hipossuficiencia.docx)

---

## Ajuste 4 — RG e órgão emissor opcionais no cadastro de cliente

### Problema
Os campos RG e órgão emissor eram obrigatórios, bloqueando o cadastro de clientes que não tinham RG disponível no momento.

### Solução
- Schema Zod atualizado para `.optional()` em `rg`, `rg_orgao_emissor` e `representanteLegal.rg`
- Labels do formulário atualizados para "(opcional)"
- Migration aplicada em produção removendo a restrição `NOT NULL` das colunas

### Arquivos modificados
- [lib/validators/schemas.ts](lib/validators/schemas.ts) — `rg` e `rg_orgao_emissor` tornados opcionais no `clientSchema` e `representanteLegalSchema`
- [components/client-form.tsx](components/client-form.tsx) — labels dos campos RG atualizados

### Migration aplicada
- [docs/migrations/009_rg_opcional.sql](docs/migrations/009_rg_opcional.sql) *(novo)*

```sql
ALTER TABLE clients ALTER COLUMN rg DROP NOT NULL;
ALTER TABLE clients ALTER COLUMN rg_orgao_emissor DROP NOT NULL;
```

**Validação em produção (13/05/2026):**
- ✅ Passo 1: Migration UP executada sem erros
- ✅ Passo 2: 5 clientes existentes listados com dados intactos
- ✅ Passo 3: `is_nullable = YES` confirmado para ambas as colunas
- ✅ Passo 4: INSERT sem RG executado com sucesso
- ✅ Passo 5: Registro de teste removido

---

## Resumo de arquivos

| Arquivo | Tipo | Ajuste |
|---------|------|--------|
| `lib/document-generation/package-builder.ts` | Modificado | 1 |
| `app/api/download/[packageId]/docx/[codigo]/route.ts` | Novo | 1 |
| `app/(app)/clientes/[id]/gerar/resultado/page.tsx` | Modificado | 1 |
| `app/(app)/clientes/[id]/page.tsx` | Modificado | 1 |
| `templates/05_procuracao_bpc_adulto.docx` | Modificado | 2 |
| `templates/06_procuracao_bpc_menor_16.docx` | Modificado | 2 |
| `templates/07_procuracao_bpc_16_a_18.docx` | Modificado | 2 |
| `templates/08_procuracao_mandado_seguranca.docx` | Modificado | 2 |
| `templates/09_declaracao_hipossuficiencia.docx` | Modificado | 3 |
| `lib/validators/schemas.ts` | Modificado | 4 |
| `components/client-form.tsx` | Modificado | 4 |
| `docs/migrations/009_rg_opcional.sql` | Novo | 4 |

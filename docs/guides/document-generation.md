# Geração de Documentos

## ⚠ Invariante crítica — templates em produção

Os templates DOCX de produção **vivem no Supabase Storage** (bucket `templates`), não no repo. A função `getTemplateBuffer()` em `package-builder.ts` verifica o campo `storage_path` da tabela `document_templates`: se preenchido, faz download do Storage; caso contrário, lê do filesystem.

**Editar arquivos `.docx` no repo não afeta produção.** Para corrigir um template em produção:
1. Baixar o arquivo atual do Storage
2. Aplicar as alterações localmente
3. Fazer upload de volta via Supabase Storage API (`upsert: true`)

Templates de produção mapeados no banco (21/05/2026):

| Código | Arquivo no Storage |
|--------|-------------------|
| `01` | `templates/01_01_contrato_honorarios.docx` |
| `02` | `templates/02_02_procuracao.docx` |
| `03` | `templates/03_03_declaracao_hipossuficiencia.docx` |
| `04` | `templates/04_04_declaracao_residencia.docx` |
| `05` | `templates/05_termo_representacao_inss.docx` |
| `06` | `templates/06_06_declaracao_separacao.docx` |
| `07` | `templates/07_07_declaracao_inatividade_mei.docx` |
| `15` | `templates/15_termo_responsabilidade.docx` |

---

## Fluxo completo

### 1. Seleção de templates (`/clientes/[id]/gerar`)

A advogada escolhe livremente entre os 15 templates disponíveis. Não há kits pré-configurados.

Filtros disponíveis por família: Todos / Contratos / Procurações / Declarações / Termos.

### 2. Campos contextuais (`/clientes/[id]/gerar/campos`)

O sistema calcula a **união** dos campos contextuais necessários para os templates selecionados:

| Grupo | Quando é necessário |
|-------|-------------------|
| `representante_legal` | Templates 03, 04, 06, 07 |
| `testemunhas` | Template 02 |
| `conjuge` | Templates 11, 13 |
| `filho_dependente` | Template 10 |
| `imovel` | Template 10 |
| `empresa_mei` | Template 12 |

Se o cliente já tiver esses dados salvos de uma geração anterior, o passo é pulado automaticamente. Caso contrário, o sistema exibe apenas os grupos que faltam.

### 3. Geração e download (`/clientes/[id]/gerar/resultado`)

O sistema processa cada template em paralelo:

**Para templates `.docx`:**
1. Renderiza com `docxtemplater` usando os dados do cliente
2. Converte para `.pdf` via LibreOffice headless

**Para templates `.pdf` INSS:**
1. Abre o PDF original com `pdf-lib`
2. Sobrepõe texto nos campos mapeados por coordenadas (x, y)

**Empacotamento:**
- Todos os PDFs são compactados em um `.zip`
- Para cada template DOCX convertido a PDF, o DOCX renderizado **também é incluído no ZIP** (`package-builder.ts` — linha após `zip.file(nomeArquivo, fileBuffer)`)
- O ZIP é salvo no Supabase Storage (bucket `pacotes`)
- Registro criado em `generation_packages` e `generated_documents`
- Download disponível por **30 dias**

### Padrão de nomenclatura dos arquivos

```
[NOME_CLIENTE_NORMALIZADO]_[CODIGO]_[NOME_DOC]_[YYYYMMDD].pdf
```

Exemplo: `MARIA_DA_SILVA_SANTOS_01_Contrato_BPC_Adulto_20260428.pdf`

## Declaração de Hipossuficiência — todos os processos

A Declaração de Hipossuficiência (código `03`) é incluída automaticamente em **qualquer tipo de ação** (`beneficios: []` em `cadeia-documental.ts`). Não é mais restrita ao BPC.

## Assinatura digital da Dra. Lidiane — sempre ativa

No Termo de Representação INSS (template `05`), a assinatura da Dra. Lidiane é **sempre incluída** quando ela é a advogada selecionada. O toggle foi removido do wizard — `incluir_assinatura_lidiane` é hardcoded como `true` em `step-confirmacao.tsx`.

## PDFs do INSS — checkboxes

Os formulários do INSS (templates 13, 14, 15) possuem checkboxes que **não são marcados automaticamente**. A advogada deve marcá-los manualmente após imprimir o documento.

## Campos contextuais — mapeamento de chaves

Os dados coletados pelo formulário (`contextual-fields-form.tsx`) **e pelo subformulário inline do wizard** (`step-gatilhos.tsx`) são gravados como JSONB na tabela `client_contextual_data`. As chaves usadas **devem ser idênticas** às lidas por `buildTemplateContext()` e às usadas nos placeholders dos templates.

### Grupo `representante_legal`

| Chave no DB | Lida em `buildTemplateContext` | Placeholder nos templates |
|---|---|---|
| `nome_completo` | `ctx.representante_legal?.nome_completo` | `{representante.nome_completo}` |
| `cpf` | `ctx.representante_legal?.cpf` | `{representante.cpf}` |
| `rg` | `ctx.representante_legal?.rg` | `{representante.rg}` |
| `parentesco` | `ctx.representante_legal?.parentesco` | `{representante.parentesco}` |
| `nome_mae` | *(não mapeado no contexto ainda)* | *(não usado nos templates ainda)* |

> **Invariante:** nunca usar a chave `nome` para o nome do representante. A chave correta é `nome_completo` em todas as camadas. Bug corrigido em 2026-05-20.

### RG do representante — comportamento condicional

O campo `rg` do representante é **opcional** em todo o sistema:
- No subformulário do wizard, o campo RG nunca bloqueia o avanço.
- No template de produção `01_01_contrato_honorarios.docx` (Storage), o RG aparece em dois lugares com lógica condicional idêntica: o trecho some completamente quando `representante.rg` é vazio — sem rótulo "RG:" solto.
  - **Cabeçalho** (`bloco_contratante_menor`): `{#representante.rg}, RG: {representante.rg}{/representante.rg}` — inline no parágrafo de qualificação.
  - **Assinatura** (`bloco_assinatura_menor`): parágrafo inteiro `RG: {representante.rg}` envolvido por `{#representante.rg}` / `{/representante.rg}` em parágrafos separados.
- O mesmo padrão deve ser usado ao criar novos templates que incluam o RG do representante.

## Histórico e exclusão de pacotes

Todo pacote gerado fica registrado no perfil do cliente. Re-download disponível por 30 dias após a geração. Após esse prazo, o arquivo ZIP é deletado do storage mas o registro histórico permanece.

A advogada pode excluir qualquer pacote manualmente pelo ícone de lixeira no histórico do cliente. A exclusão é **hard delete**: remove `generated_documents`, `generation_packages` e o ZIP do bucket `pacotes` no Storage. Rota: `DELETE /api/geracao/[packageId]`.

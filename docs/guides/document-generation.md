# Geração de Documentos

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

**Para templates `.docx` (12-15):**
1. Renderiza com `docxtemplater` usando os dados do cliente
2. Converte para `.pdf` via CloudConvert API

**Para templates `.pdf` INSS (3):**
1. Abre o PDF original com `pdf-lib`
2. Sobrepõe texto nos campos mapeados por coordenadas (x, y)

**Empacotamento:**
- Todos os PDFs são compactados em um `.zip`
- O ZIP é salvo no Supabase Storage
- Registro criado em `generation_packages` e `generated_documents`
- Download disponível por **30 dias**

### Padrão de nomenclatura dos arquivos

```
[NOME_CLIENTE_NORMALIZADO]_[CODIGO]_[NOME_DOC]_[YYYYMMDD].pdf
```

Exemplo: `MARIA_DA_SILVA_SANTOS_01_Contrato_BPC_Adulto_20260428.pdf`

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
- Nos templates 03 e 04, o RG aparece em dois lugares com lógica condicional idêntica: o trecho some completamente quando `representante.rg` é vazio — sem rótulo "RG:" solto.
  - **Cabeçalho** (`bloco_contratante_menor`): `{#representante.rg}, RG: {representante.rg}{/representante.rg}` — inline no parágrafo de qualificação.
  - **Assinatura** (`bloco_assinatura_menor`): parágrafo inteiro `RG: {representante.rg}` envolvido por `{#representante.rg}` / `{/representante.rg}` em parágrafos separados.
- O mesmo padrão deve ser usado ao criar novos templates que incluam o RG do representante.

## Histórico

Todo pacote gerado fica registrado no perfil do cliente. Re-download disponível por 30 dias após a geração. Após esse prazo, o arquivo ZIP é deletado do storage mas o registro histórico permanece.

# Catálogo de Templates

Esta pasta contém os 15 arquivos de template para geração de documentos jurídicos.

## Arquivos esperados

| Código | Arquivo | Família | Formato | Campos contextuais |
|--------|---------|---------|---------|-------------------|
| 01 | `01_contrato_bpc_adulto.docx` | contrato | docx | — |
| 02 | `02_contrato_bpc_a_rogo.docx` | contrato | docx | testemunhas (2) |
| 03 | `03_contrato_bpc_menor_16.docx` | contrato | docx | representante_legal |
| 04 | `04_contrato_bpc_menor_16_a_18.docx` | contrato | docx | representante_legal |
| 05 | `05_procuracao_bpc_adulto.docx` | procuracao | docx | — |
| 06 | `06_procuracao_bpc_menor_16.docx` | procuracao | docx | representante_legal |
| 07 | `07_procuracao_bpc_16_a_18.docx` | procuracao | docx | representante_legal |
| 08 | `08_procuracao_mandado_seguranca.docx` | procuracao | docx | — |
| 09 | `09_declaracao_hipossuficiencia.docx` | declaracao | docx | — |
| 10 | `10_declaracao_residencia.docx` | declaracao | docx | filho_dependente, imovel |
| 11 | `11_declaracao_separacao.docx` | declaracao | docx | conjuge |
| 12 | `12_declaracao_inatividade_mei.docx` | declaracao | docx | empresa_mei |
| 13 | `13_declaracao_separacao_fato_inss.pdf` | declaracao | pdf | conjuge |
| 14 | `14_termo_representacao_inss.pdf` | termo | pdf | — |
| 15 | `15_termo_responsabilidade_inss.pdf` | termo | pdf | — |

## Contrato de variáveis

Os templates .docx usam a sintaxe `{{ variavel }}`. Variáveis disponíveis:

### `cliente.*`
- `nome_completo`, `nacionalidade`, `genero`, `estado_civil`
- `data_nascimento`, `cpf`, `rg`, `rg_orgao_emissor`
- `nome_mae`, `nome_pai`
- `endereco_logradouro`, `endereco_numero`, `endereco_complemento`
- `endereco_bairro`, `endereco_cidade`, `endereco_uf`, `endereco_cep`

### `escritorio.*`
- `advogada_principal_nome`, `advogada_principal_nome_curto`, `advogada_principal_oab`
- `advogada_parceira_nome`, `advogada_parceira_nome_curto`, `advogada_parceira_oab`
- `endereco_*` (mesmos campos do cliente)

### `documento.*`
- `cidade`, `uf`, `data_extenso` (ex: "28 de abril de 2026")

### `representante.*`
- `nome`, `cpf`, `rg`, `parentesco`, `nome_mae`

### `conjuge.*`
- `data_separacao`

### `filho_dependente.*`
- `nome`, `cpf`, `rg`, `data_nascimento`

### `imovel.*`
- `proprietario_nome`

### `empresa_mei.*`
- `razao_social`, `cnpj`, `cnae`, `ramo`
- `data_abertura`, `data_inatividade`, `descricao_inicio_inatividade`

### `testemunhas` (array de 2)
- `testemunhas[0].nome`, `testemunhas[0].cpf`, `testemunhas[0].rg`
- `testemunhas[1].nome`, `testemunhas[1].cpf`, `testemunhas[1].rg`

## PDFs do INSS (templates 13, 14, 15)

Esses arquivos são formulários oficiais do INSS. O sistema faz overlay de texto via `pdf-lib`.
**Os checkboxes devem ser marcados manualmente pela advogada.**

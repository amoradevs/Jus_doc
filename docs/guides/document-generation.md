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

## Histórico

Todo pacote gerado fica registrado no perfil do cliente. Re-download disponível por 30 dias após a geração. Após esse prazo, o arquivo ZIP é deletado do storage mas o registro histórico permanece.

# Guia de Preparação de Templates DOCX

Este guia explica como preparar um documento DOCX para uso no sistema de geração automática de documentos. O processo consiste em substituir os dados estáticos (nome, CPF, endereço etc.) pelas **tags** correspondentes — o sistema preenche automaticamente cada tag com os dados do cliente no momento da geração.

---

## Como editar um DOCX

1. Abra o arquivo `.docx` no Microsoft Word ou LibreOffice Writer
2. Use **Ctrl+H** (Localizar e Substituir) para localizar cada dado estático
3. Substitua pelo `{tag}` correspondente (exemplos abaixo)
4. Mantenha a formatação original ao redor da tag (negrito, tamanho de fonte etc.)
5. Salve o arquivo
6. Faça upload em **Configurações → Templates**

> **Atenção:** As tags usam chaves simples `{tag}`, sem aspas, sem espaços internos.  
> Pontuação fica **fora** das chaves: `nascido em {cliente.data_nascimento},` ✅

---

## Cheat Sheet — Todas as tags disponíveis

### `{cliente.*}` — Dados do cliente _(sempre disponíveis)_

| Tag | Descrição | Exemplo de saída |
|-----|-----------|-----------------|
| `{cliente.nome_completo}` | Nome completo | SERGIO EDROSO FALASHI |
| `{cliente.nacionalidade}` | Nacionalidade | brasileiro |
| `{cliente.genero}` | Gênero | masculino / feminino |
| `{cliente.estado_civil}` | Estado civil | casado |
| `{cliente.data_nascimento}` | Data de nascimento | 18/07/1959 |
| `{cliente.cpf}` | CPF formatado | 012.916.138-11 |
| `{cliente.rg}` | Número do RG | 11.815.528-3 |
| `{cliente.rg_orgao_emissor}` | Órgão emissor do RG | SSP/SP |
| `{cliente.nome_mae}` | Nome da mãe | — |
| `{cliente.nome_pai}` | Nome do pai (opcional) | — |
| `{cliente.endereco_logradouro}` | Rua/Avenida | Rua das Flores |
| `{cliente.endereco_numero}` | Número | 123 |
| `{cliente.endereco_complemento}` | Complemento (opcional) | Apto 45 |
| `{cliente.endereco_bairro}` | Bairro | Centro |
| `{cliente.endereco_cidade}` | Cidade | São Paulo |
| `{cliente.endereco_uf}` | Estado (sigla) | SP |
| `{cliente.endereco_cep}` | CEP formatado | 01310-100 |

**Endereço completo em uma linha:**
```
{cliente.endereco_logradouro}, {cliente.endereco_numero}, {cliente.endereco_bairro} - {cliente.endereco_cidade}/{cliente.endereco_uf}, CEP {cliente.endereco_cep}
```

---

### `{escritorio.*}` — Dados do escritório _(sempre disponíveis)_

| Tag | Descrição |
|-----|-----------|
| `{escritorio.advogada_principal_nome}` | Nome completo da Advogada 1 |
| `{escritorio.advogada_principal_oab}` | OAB da Advogada 1 (ex: OAB/SP 220.305) |
| `{escritorio.advogada_parceira_nome}` | Nome completo da Advogada 2 |
| `{escritorio.advogada_parceira_oab}` | OAB da Advogada 2 (ex: OAB 218.550-SP) |
| `{escritorio.endereco_logradouro}` | Rua do escritório |
| `{escritorio.endereco_numero}` | Número do escritório |
| `{escritorio.endereco_bairro}` | Bairro do escritório |
| `{escritorio.endereco_cidade}` | Cidade do escritório |
| `{escritorio.endereco_uf}` | Estado do escritório |
| `{escritorio.endereco_cep}` | CEP do escritório |

---

### `{documento.*}` — Metadados do documento _(sempre disponíveis)_

| Tag | Descrição | Exemplo de saída |
|-----|-----------|-----------------|
| `{documento.data_extenso}` | Data por extenso | 6 de maio de 2026 |
| `{documento.cidade}` | Cidade do **cliente** | São Paulo |
| `{documento.uf}` | Estado do **cliente** | SP |

> A cidade/data ao final do documento usa sempre a cidade de residência do cliente.  
> Exemplo: `{documento.cidade}, {documento.data_extenso}`

---

### `{representante.*}` — Representante legal _(para menores de idade)_

Use quando o cliente não pode assinar por si próprio (menor de 16 anos ou 16–18 anos).

| Tag | Descrição |
|-----|-----------|
| `{representante.nome}` | Nome completo do representante |
| `{representante.cpf}` | CPF do representante |
| `{representante.rg}` | RG do representante |
| `{representante.parentesco}` | Parentesco (ex: pai, mãe, tutor) |
| `{representante.nome_mae}` | Nome da mãe do representante |

**Configurar em:** `campos_contextuais_necessarios: ["representante_legal"]`

---

### `{conjuge.*}` — Cônjuge _(para declarações de separação)_

| Tag | Descrição |
|-----|-----------|
| `{conjuge.data_separacao}` | Data da separação |

**Configurar em:** `campos_contextuais_necessarios: ["conjuge"]`

---

### `{filho_dependente.*}` — Filho dependente _(para declarações de residência)_

| Tag | Descrição |
|-----|-----------|
| `{filho_dependente.nome}` | Nome do filho |
| `{filho_dependente.cpf}` | CPF do filho (opcional) |
| `{filho_dependente.rg}` | RG do filho (opcional) |
| `{filho_dependente.data_nascimento}` | Data de nascimento |

**Configurar em:** `campos_contextuais_necessarios: ["filho_dependente"]`

---

### `{imovel.*}` — Imóvel _(para declarações de residência cedida)_

| Tag | Descrição |
|-----|-----------|
| `{imovel.proprietario_nome}` | Nome do proprietário do imóvel |

**Configurar em:** `campos_contextuais_necessarios: ["imovel"]`

---

### `{empresa_mei.*}` — Empresa MEI _(para declarações de inatividade)_

| Tag | Descrição |
|-----|-----------|
| `{empresa_mei.razao_social}` | Razão social |
| `{empresa_mei.cnpj}` | CNPJ |
| `{empresa_mei.cnae}` | Código CNAE |
| `{empresa_mei.ramo}` | Segmento/ramo de atividade |
| `{empresa_mei.data_abertura}` | Data de abertura |
| `{empresa_mei.data_inatividade}` | Data de início da inatividade |
| `{empresa_mei.descricao_inicio_inatividade}` | Descrição do início da inatividade |

**Configurar em:** `campos_contextuais_necessarios: ["empresa_mei"]`

---

### `{testemunhas}` — Testemunhas _(para contratos a rogo)_

São sempre **duas** testemunhas, indexadas por `[0]` e `[1]`.

| Tag | Descrição |
|-----|-----------|
| `{testemunhas[0].nome}` | Nome da 1ª testemunha |
| `{testemunhas[0].cpf}` | CPF da 1ª testemunha |
| `{testemunhas[0].rg}` | RG da 1ª testemunha |
| `{testemunhas[0].data_nascimento}` | Data de nascimento da 1ª testemunha |
| `{testemunhas[1].nome}` | Nome da 2ª testemunha |
| `{testemunhas[1].cpf}` | CPF da 2ª testemunha |
| `{testemunhas[1].rg}` | RG da 2ª testemunha |
| `{testemunhas[1].data_nascimento}` | Data de nascimento da 2ª testemunha |

**Configurar em:** `campos_contextuais_necessarios: ["testemunhas"]`

---

## Mapeamento: contrato de exemplo

Baseado no modelo **CONTRATO DE PRESTAÇÃO DE SERVIÇOS ADVOCATÍCIOS**:

| Texto estático no documento | Tag a usar |
|-----------------------------|-----------|
| SERGIO EDROSO FALASHI | `{cliente.nome_completo}` |
| brasileiro | `{cliente.nacionalidade}` |
| casado | `{cliente.estado_civil}` |
| CPF 012.916.138-11 | `{cliente.cpf}` |
| RG 11.815.528-3 | `{cliente.rg}` |
| 18/07/1959 | `{cliente.data_nascimento}` |
| endereço completo do cliente | ver formato acima em `{cliente.*}` |
| LIDIANE ROCHA ABREU | `{escritorio.advogada_principal_nome}` |
| OAB/SP 220.305 | `{escritorio.advogada_principal_oab}` |
| ALCIONE FERREIRA GOMES ALENCAR | `{escritorio.advogada_parceira_nome}` |
| OAB 218.550-SP | `{escritorio.advogada_parceira_oab}` |
| Cidade, data ao final | `{documento.cidade}, {documento.data_extenso}` |

---

## Tabela de templates e campos contextuais

| # | Documento | Família | Código | Campos contextuais necessários |
|---|-----------|---------|--------|-------------------------------|
| 01 | Contrato — BPC | contrato | 01 | — |
| 02 | Contrato — BPC a Rogo | contrato | 02 | `testemunhas` |
| 03 | Contrato — BPC Menor (< 16 anos) | contrato | 03 | `representante_legal` |
| 04 | Contrato — BPC Menor (16–18 anos) | contrato | 04 | `representante_legal` |
| 05 | Contrato — Aposentadoria por Idade | contrato | 16 | — |
| 06 | Declaração de Hipossuficiência — BPC | declaracao | 09 | — |
| 07 | Declaração de Hipossuficiência — Aposentadoria por Idade | declaracao | 17 | — |
| 08 | Declaração de Residência — BPC | declaracao | 10 | `filho_dependente` + `imovel` |
| 09 | Declaração de Residência — Aposentadoria por Idade | declaracao | 18 | `filho_dependente` + `imovel` |
| 10 | Declaração de Residência C — Aposentadoria por Idade | declaracao | 19 | `imovel` |
| 11 | Declaração de Separação — BPC | declaracao | 11 | `conjuge` |
| 12 | Declaração de Inatividade de Empresa | declaracao | 12 | `empresa_mei` |

> Documentos 13–20 serão mapeados conforme identificação dos arquivos restantes.

---

## Alternativa: Template Wizard

Para não editar o DOCX manualmente, use o **Template Wizard** em **Configurações → Templates → Novo Template → Usar Wizard**. Faça upload do DOCX original e a IA sugerirá automaticamente quais trechos substituir por tags. Você revisa e confirma antes de salvar.

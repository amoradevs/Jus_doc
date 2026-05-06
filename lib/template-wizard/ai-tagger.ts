import Anthropic from '@anthropic-ai/sdk';

export type TagSuggestion = {
  original: string;
  tag: string;
};

const TAG_SCHEMA = `
Grupos de tags disponíveis:

CLIENTE (dados do cliente — sempre presentes):
{cliente.nome_completo}, {cliente.nacionalidade}, {cliente.genero}, {cliente.estado_civil},
{cliente.data_nascimento}, {cliente.cpf}, {cliente.rg}, {cliente.rg_orgao_emissor},
{cliente.nome_mae}, {cliente.nome_pai},
{cliente.endereco_logradouro}, {cliente.endereco_numero}, {cliente.endereco_complemento},
{cliente.endereco_bairro}, {cliente.endereco_cidade}, {cliente.endereco_uf}, {cliente.endereco_cep}

ESCRITÓRIO (dados do escritório — sempre presentes):
{escritorio.advogada_principal_nome}, {escritorio.advogada_principal_oab},
{escritorio.advogada_principal_email},
{escritorio.advogada_parceira_nome}, {escritorio.advogada_parceira_oab},
{escritorio.advogada_parceira_email},
{escritorio.endereco_logradouro}, {escritorio.endereco_numero}, {escritorio.endereco_complemento},
{escritorio.endereco_bairro}, {escritorio.endereco_cidade}, {escritorio.endereco_uf}, {escritorio.endereco_cep}

DOCUMENTO (metadados — sempre presentes):
{documento.data_extenso}, {documento.cidade}, {documento.uf}

REPRESENTANTE LEGAL (para menores — opcional):
{representante.nome}, {representante.cpf}, {representante.rg},
{representante.parentesco}, {representante.nome_mae}

CÔNJUGE (declarações de separação — opcional):
{conjuge.data_separacao}

FILHO DEPENDENTE (declarações de residência — opcional):
{filho_dependente.nome}, {filho_dependente.cpf}, {filho_dependente.rg},
{filho_dependente.data_nascimento}

IMÓVEL (declarações de residência — opcional):
{imovel.proprietario_nome}

EMPRESA MEI (declarações de inatividade — opcional):
{empresa_mei.razao_social}, {empresa_mei.cnpj}, {empresa_mei.cnae},
{empresa_mei.ramo}, {empresa_mei.data_abertura}, {empresa_mei.data_inatividade},
{empresa_mei.descricao_inicio_inatividade}

TESTEMUNHAS (contratos a rogo — opcional, array de 2):
{testemunhas[0].nome}, {testemunhas[0].cpf}, {testemunhas[0].rg}, {testemunhas[0].data_nascimento}
{testemunhas[1].nome}, {testemunhas[1].cpf}, {testemunhas[1].rg}, {testemunhas[1].data_nascimento}
`.trim();

const SYSTEM_PROMPT = `Você é um assistente especializado em documentos jurídicos brasileiros.
Receberá o texto extraído de um arquivo DOCX de escritório de advocacia previdenciária.
Seu trabalho é identificar os dados estáticos que devem ser substituídos por tags dinâmicas.

Schema de tags disponíveis:
${TAG_SCHEMA}

Regras:
- Substitua apenas dados concretos: nomes de pessoas, CPF, RG, OAB, datas, endereços, números de documento
- NÃO substitua: texto de cláusulas, títulos, texto jurídico genérico, artigos de lei
- Para endereço completo em uma linha, retorne a linha inteira como "original" e a tag composta como "tag"
- CPF: identifique pelo formato XXX.XXX.XXX-XX ou texto junto a "CPF"
- RG: identifique pelo formato com pontos/traços ou texto junto a "RG"
- Data ao final do documento (cidade, data): usar {documento.cidade} e {documento.data_extenso}
- Retorne um array JSON com objetos { "original": "texto exato no documento", "tag": "{tag.correspondente}" }
- O campo "original" deve ser o texto EXATO como aparece no documento (case-sensitive)
- Retorne APENAS o JSON, sem markdown, sem explicações`;

export async function suggestTags(text: string): Promise<TagSuggestion[]> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY não configurada.');
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Analise este documento jurídico e retorne as sugestões de tags:\n\n${text.slice(0, 8000)}`,
      },
    ],
    system: SYSTEM_PROMPT,
  });

  const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : '[]';

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is TagSuggestion =>
        typeof item === 'object' &&
        typeof item.original === 'string' &&
        typeof item.tag === 'string' &&
        item.original.length > 0 &&
        item.tag.startsWith('{') &&
        item.tag.endsWith('}'),
    );
  } catch {
    return [];
  }
}

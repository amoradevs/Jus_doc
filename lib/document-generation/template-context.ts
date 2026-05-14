import { db } from '@/lib/db';
import type { Cenario } from './cadeia-documental';

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Converte palavras com desinência de gênero para o padrão neutro "(a)"
// ex: "divorciado" → "divorciado(a)", "brasileiro" → "brasileiro(a)"
function neutralizar(palavra: string): string {
  if (!palavra) return '';
  if (palavra.endsWith('(a)')) return palavra;
  if (palavra.endsWith('o')) return palavra + '(a)';
  if (palavra.endsWith('a')) return palavra.slice(0, -1) + 'o(a)';
  return palavra;
}

const ESTADO_CIVIL_NEUTRO: Record<string, string> = {
  solteiro:      'solteiro(a)',
  casado:        'casado(a)',
  separado:      'separado(a)',
  divorciado:    'divorciado(a)',
  viuvo:         'viúvo(a)',
  uniao_estavel: 'em união estável',
};

function calcularIdade(dataIso: string): number {
  const nasc = new Date(dataIso);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
}

function formatarCPF(cpf: string): string {
  const d = (cpf ?? '').replace(/\D/g, '');
  return d.length === 11 ? `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}` : cpf;
}

function formatarCEP(cep: string): string {
  const d = (cep ?? '').replace(/\D/g, '');
  return d.length === 8 ? `${d.slice(0,5)}-${d.slice(5)}` : cep;
}

function formatarData(iso: string): string {
  if (!iso) return '';
  // Add noon UTC to avoid timezone-shift to previous day
  const d = new Date(`${iso.slice(0, 10)}T12:00:00Z`);
  return d.toLocaleDateString('pt-BR');
}

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

// ─── Tipo de benefício → descrições e checkboxes ──────────────────────────────

const TIPO_BENEFICIO_MAP: Record<string, { descricao: string; objeto: string; marcados: string[] }> = {
  aposentadoria_idade_urbana: {
    descricao: 'BENEFÍCIO DE APOSENTADORIA POR IDADE URBANA',
    objeto: 'ingressar com Pedido de BENEFÍCIO DE APOSENTADORIA POR IDADE EM FACE DA PREVIDÊNCIA SOCIAL (Instituto Nacional do Seguro Social – INSS)',
    marcados: ['aposentadoria_idade', 'aposentadoria_idade_urbana'],
  },
  aposentadoria_idade_rural: {
    descricao: 'BENEFÍCIO DE APOSENTADORIA POR IDADE RURAL',
    objeto: 'ingressar com Pedido de BENEFÍCIO DE APOSENTADORIA POR IDADE RURAL EM FACE DA PREVIDÊNCIA SOCIAL (Instituto Nacional do Seguro Social – INSS)',
    marcados: ['aposentadoria_idade', 'aposentadoria_idade_rural'],
  },
  bpc_idoso: {
    descricao: 'BENEFÍCIO DE PRESTAÇÃO CONTINUADA – IDOSO',
    objeto: 'ingressar com Pedido de BENEFÍCIO DE PRESTAÇÃO CONTINUADA EM FACE DA PREVIDÊNCIA SOCIAL (Instituto Nacional do Seguro Social – INSS)',
    marcados: ['bpc'],
  },
  bpc_deficiente_adulto: {
    descricao: 'BENEFÍCIO DE PRESTAÇÃO CONTINUADA – DEFICIENTE',
    objeto: 'ingressar com Pedido de BENEFÍCIO DE PRESTAÇÃO CONTINUADA EM FACE DA PREVIDÊNCIA SOCIAL (Instituto Nacional do Seguro Social – INSS)',
    marcados: ['bpc'],
  },
  bpc_deficiente_menor_16: {
    descricao: 'BENEFÍCIO DE PRESTAÇÃO CONTINUADA – DEFICIENTE MENOR',
    objeto: 'ingressar com Pedido de BENEFÍCIO DE PRESTAÇÃO CONTINUADA EM FACE DA PREVIDÊNCIA SOCIAL (Instituto Nacional do Seguro Social – INSS)',
    marcados: ['bpc'],
  },
  bpc_deficiente_16_18: {
    descricao: 'BENEFÍCIO DE PRESTAÇÃO CONTINUADA – DEFICIENTE',
    objeto: 'ingressar com Pedido de BENEFÍCIO DE PRESTAÇÃO CONTINUADA EM FACE DA PREVIDÊNCIA SOCIAL (Instituto Nacional do Seguro Social – INSS)',
    marcados: ['bpc'],
  },
  bpc_loas: {
    descricao: 'BENEFÍCIO DE PRESTAÇÃO CONTINUADA – BPC/LOAS',
    objeto: 'ingressar com Pedido de BENEFÍCIO DE PRESTAÇÃO CONTINUADA EM FACE DA PREVIDÊNCIA SOCIAL (Instituto Nacional do Seguro Social – INSS)',
    marcados: ['bpc'],
  },
  aposentadoria_tempo_contribuicao: {
    descricao: 'BENEFÍCIO DE APOSENTADORIA POR TEMPO DE CONTRIBUIÇÃO',
    objeto: 'ingressar com Pedido de BENEFÍCIO DE APOSENTADORIA POR TEMPO DE CONTRIBUIÇÃO EM FACE DA PREVIDÊNCIA SOCIAL (Instituto Nacional do Seguro Social – INSS)',
    marcados: ['aposentadoria_tempo'],
  },
  aposentadoria_especial: {
    descricao: 'BENEFÍCIO DE APOSENTADORIA ESPECIAL',
    objeto: 'ingressar com Pedido de BENEFÍCIO DE APOSENTADORIA ESPECIAL EM FACE DA PREVIDÊNCIA SOCIAL (Instituto Nacional do Seguro Social – INSS)',
    marcados: ['aposentadoria_especial'],
  },
  pensao_morte: {
    descricao: 'BENEFÍCIO DE PENSÃO POR MORTE PREVIDENCIÁRIA',
    objeto: 'ingressar com Pedido de BENEFÍCIO DE PENSÃO POR MORTE EM FACE DA PREVIDÊNCIA SOCIAL (Instituto Nacional do Seguro Social – INSS)',
    marcados: ['pensao_morte'],
  },
  mandado_seguranca: {
    descricao: 'IMPETRAÇÃO DE MANDADO DE SEGURANÇA',
    objeto: 'impetrar MANDADO DE SEGURANÇA em face do INSS (Instituto Nacional do Seguro Social)',
    marcados: [],
  },
};

const TODAS_OPCOES_CHECKBOX = [
  'aposentadoria_idade', 'aposentadoria_idade_urbana', 'aposentadoria_idade_rural',
  'aposentadoria_tempo', 'aposentadoria_especial',
  'pensao_morte', 'pensao_morte_urbana', 'pensao_morte_rural',
  'auxilio_reclusao', 'auxilio_reclusao_urbano', 'auxilio_reclusao_rural',
  'salario_maternidade', 'salario_maternidade_urbano', 'salario_maternidade_rural',
  'bpc', 'atualizacao_cadastral',
];

// ─── Tipo exportado ───────────────────────────────────────────────────────────

export type TemplateContext = {
  bloco_contratante_maior_capaz: boolean;
  bloco_contratante_a_rogo: boolean;
  bloco_contratante_menor: boolean;
  bloco_paragrafos_recurso: boolean;
  bloco_mora_sozinho: boolean;
  bloco_mora_com_dependentes: boolean;

  cliente: { nome_completo: string; nacionalidade: string; estado_civil: string; cpf: string; rg: string; rg_orgao_emissor: string; data_nascimento: string; nome_mae: string; nome_pai: string; nit: string; condicao_menor: string };
  endereco: { logradouro: string; numero: string; complemento_formatado: string; bairro: string; cidade: string; uf: string; cep: string };
  imovel: { cedido: boolean; proprietario_nome: string };
  representante: { nome_completo: string; cpf: string; rg: string; parentesco: string };
  dependentes: Array<{ nome_completo: string; cpf: string; rg: string; data_nascimento: string; parentesco: string }>;
  conjuge: { nome_completo: string; data_nascimento: string };
  separacao: { data: string; recebe_pensao: boolean; valor_pensao: string };
  empresa: { cnpj: string; razao_social: string; cnae: string; ramo: string; data_abertura: string; data_inicio_inatividade: string };
  testemunhas: Array<{ tipo_label: string; nome_completo: string; cpf: string; rg: string; data_nascimento: string }>;
  processo: { tipo_beneficio_descricao: string; objeto_procuracao: string };
  // Blocos de honorários (exatamente um ativo por geração)
  bloco_honorarios_padrao: boolean;          // BPC adulto, Aposentadoria, qualquer adulto
  bloco_honorarios_menor: boolean;           // qualquer benefício + perfil menor
  bloco_honorarios_mandado_seguranca: boolean; // MS (valor fixo)

  // Blocos de assinatura (exatamente um ativo por geração)
  bloco_assinatura_adulto: boolean;          // adulto capaz (qualquer benefício)
  bloco_assinatura_a_rogo: boolean;          // adulto a rogo
  bloco_assinatura_menor: boolean;           // menor (representante assina)

  // Seleção de advogada para geração (Bloco 2+)
  mostrar_lidiane: boolean;
  mostrar_alcione: boolean;
  tem_duas_advogadas: boolean;

  honorarios: { qtd_salarios: number; qtd_salarios_extenso: string; percentual_padrao: number; percentual_padrao_extenso: string; percentual_recurso: number; percentual_recurso_extenso: string; valor_fixo: string; valor_fixo_extenso: string };
  multa: { qtd_salarios_minimos: number; qtd_salarios_minimos_extenso: string };
  escritorio: { adv1_nome: string; adv1_cpf: string; adv1_oab: string; adv1_email: string; adv2_nome: string; adv2_oab: string; adv2_cpf: string; adv2_email: string; endereco_logradouro: string; endereco_numero: string; endereco_complemento: string; endereco_bairro: string; endereco_cidade: string; endereco_uf: string; endereco_cep: string; foro_eleito: string };
  doc: { cidade_assinatura: string; dia_assinatura: string; mes_assinatura_extenso: string; mes_assinatura_numero: string; ano_assinatura: string };
  checkbox: Record<string, string>;
};

// ─── Mapeamento BeneficioId → texto jurídico ──────────────────────────────────

const BENEFICIO_ID_MAP: Record<string, { descricao: string; objeto: string; marcados: string[] }> = {
  bpc: {
    descricao: 'BENEFÍCIO DE PRESTAÇÃO CONTINUADA – BPC/LOAS',
    objeto: 'ingressar com Pedido de BENEFÍCIO DE PRESTAÇÃO CONTINUADA EM FACE DA PREVIDÊNCIA SOCIAL (Instituto Nacional do Seguro Social – INSS)',
    marcados: ['bpc'],
  },
  aposentadoria_idade: {
    descricao: 'BENEFÍCIO DE APOSENTADORIA POR IDADE',
    objeto: 'ingressar com Pedido de BENEFÍCIO DE APOSENTADORIA POR IDADE EM FACE DA PREVIDÊNCIA SOCIAL (Instituto Nacional do Seguro Social – INSS)',
    marcados: ['aposentadoria_idade'],
  },
  mandado_seguranca: {
    descricao: 'IMPETRAÇÃO DE MANDADO DE SEGURANÇA',
    objeto: 'impetrar MANDADO DE SEGURANÇA em face do INSS (Instituto Nacional do Seguro Social)',
    marcados: [],
  },
};

const PERFIS_MENORES_ID = new Set(['menor_impubere', 'menor_pubere', 'incapaz_curador']);

/**
 * Retorna os overrides de bloco_* e processo.* derivados exclusivamente do
 * cenário do wizard. Função pura — sem efeitos colaterais ou acesso ao DB.
 */
export function getCenarioContextOverrides(cenario: Cenario): Partial<TemplateContext> {
  const ehMenor = PERFIS_MENORES_ID.has(cenario.perfil);
  const ehARogo = cenario.perfil === 'a_rogo';
  const ehMS = cenario.beneficio === 'mandado_seguranca';

  const bloco_contratante_menor = ehMenor;
  const bloco_contratante_a_rogo = !ehMenor && ehARogo;
  const bloco_contratante_maior_capaz = !ehMenor && !ehARogo;

  const bloco_assinatura_menor = ehMenor;
  const bloco_assinatura_a_rogo = !ehMenor && ehARogo;
  const bloco_assinatura_adulto = !ehMenor && !ehARogo;

  const bloco_honorarios_menor = ehMenor;
  const bloco_honorarios_mandado_seguranca = ehMS && !ehMenor;
  const bloco_honorarios_padrao = !ehMS && !ehMenor;

  const bloco_paragrafos_recurso = !ehMS;

  const benInfo = BENEFICIO_ID_MAP[cenario.beneficio] ?? BENEFICIO_ID_MAP.bpc;

  const checkboxCenario: Record<string, string> = {};
  for (const opcao of TODAS_OPCOES_CHECKBOX) {
    checkboxCenario[opcao] = benInfo.marcados.includes(opcao) ? '☑' : '☐';
  }

  return {
    bloco_contratante_maior_capaz,
    bloco_contratante_a_rogo,
    bloco_contratante_menor,
    bloco_paragrafos_recurso,
    bloco_honorarios_padrao,
    bloco_honorarios_menor,
    bloco_honorarios_mandado_seguranca,
    bloco_assinatura_adulto,
    bloco_assinatura_a_rogo,
    bloco_assinatura_menor,
    processo: {
      tipo_beneficio_descricao: benInfo.descricao,
      objeto_procuracao: benInfo.objeto,
    },
    checkbox: checkboxCenario,
  };
}

// ─── Builder principal ────────────────────────────────────────────────────────

export type AdvogadasSelecionadas = 'lidiane' | 'alcione' | 'ambas';

export async function buildTemplateContext(
  clientId: string,
  tenantId: string,
  cenario?: Cenario,
  advogadas: AdvogadasSelecionadas = 'ambas',
  processoId?: string,
): Promise<TemplateContext> {
  const { data: clientRows } = await db
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .eq('tenant_id', tenantId)
    .is('deletado_em', null)
    .limit(1);

  const client = clientRows?.[0];
  if (!client) throw new Error('Cliente não encontrado');

  const [{ data: contextualRows }, { data: settingsRows }] = await Promise.all([
    db.from('client_contextual_data').select('*').eq('client_id', clientId).limit(1),
    db.from('office_settings').select('*').eq('tenant_id', tenantId).limit(1),
  ]);

  const ctx = contextualRows?.[0] ?? null;
  const settings = settingsRows?.[0] ?? null;

  // ── Blocos condicionais ────────────────────────────────────────────────────
  const idade = calcularIdade(client.data_nascimento);
  const ehMenor = idade < 18;
  const sabeAssinar = client.sabe_assinar !== false; // default true

  const bloco_contratante_menor = ehMenor;
  const bloco_contratante_maior_capaz = !ehMenor && sabeAssinar;
  const bloco_contratante_a_rogo = !ehMenor && !sabeAssinar;

  let tipoBeneficio = '';
  if (processoId) {
    const { data: processoRows, error: processoError } = await db
      .from('processos')
      .select('tipo_beneficio')
      .eq('id', processoId)
      .limit(1);
    console.log('[template-context] processoId:', processoId, '| tipo_beneficio:', processoRows?.[0]?.tipo_beneficio ?? 'NÃO ENCONTRADO', '| erro:', processoError?.message ?? 'none');
    tipoBeneficio = processoRows?.[0]?.tipo_beneficio ?? '';
  } else {
    console.log('[template-context] processoId: NÃO FORNECIDO → checkboxes todos vazios');
  }
  const tipoInfo = TIPO_BENEFICIO_MAP[tipoBeneficio] ?? { descricao: '', objeto: '', marcados: [] };
  const bloco_paragrafos_recurso = tipoBeneficio !== 'mandado_seguranca';

  // ── Dependentes ───────────────────────────────────────────────────────────
  type Dependente = { nome_completo?: string; cpf?: string; rg?: string; data_nascimento?: string; parentesco?: string };
  const fdRaw = ctx?.filho_dependente;
  const dependentesRaw: Dependente[] = !fdRaw ? [] : Array.isArray(fdRaw) ? fdRaw : [fdRaw];
  const dependentes = dependentesRaw
    .filter((d) => d?.nome_completo)
    .map((d) => ({
      nome_completo: d.nome_completo ?? '',
      cpf: formatarCPF(d.cpf ?? ''),
      rg: d.rg ?? '',
      data_nascimento: formatarData(d.data_nascimento ?? ''),
      parentesco: d.parentesco ?? '',
    }));

  const bloco_mora_sozinho = dependentes.length === 0;
  const bloco_mora_com_dependentes = dependentes.length > 0;

  // ── Imóvel ────────────────────────────────────────────────────────────────
  type ImovelData = { cedido?: boolean | string; proprietario_nome?: string };
  const imovelRaw: ImovelData = (ctx?.imovel as ImovelData) ?? {};
  const imovelCedido = imovelRaw.cedido === true || imovelRaw.cedido === 'true';

  // ── Checkboxes ────────────────────────────────────────────────────────────
  const checkbox: Record<string, string> = {};
  for (const opcao of TODAS_OPCOES_CHECKBOX) {
    checkbox[opcao] = tipoInfo.marcados.includes(opcao) ? '☑' : '☐';
  }

  // ── Data de assinatura ────────────────────────────────────────────────────
  const hoje = new Date();

  // ── Contexto final ────────────────────────────────────────────────────────
  const baseContext: TemplateContext = {
    // Blocos condicionais de contratante
    bloco_contratante_maior_capaz,
    bloco_contratante_a_rogo,
    bloco_contratante_menor,
    bloco_paragrafos_recurso,
    bloco_mora_sozinho,
    bloco_mora_com_dependentes,

    // Blocos de honorários
    bloco_honorarios_padrao: tipoBeneficio !== 'mandado_seguranca' && !ehMenor,
    bloco_honorarios_menor: ehMenor,
    bloco_honorarios_mandado_seguranca: tipoBeneficio === 'mandado_seguranca' && !ehMenor,

    // Blocos de assinatura
    bloco_assinatura_adulto: !ehMenor && sabeAssinar,
    bloco_assinatura_a_rogo: !ehMenor && !sabeAssinar,
    bloco_assinatura_menor: ehMenor,

    // Cliente
    cliente: {
      nome_completo: client.nome_completo ?? '',
      nacionalidade: neutralizar(client.nacionalidade ?? 'brasileiro'),
      estado_civil: ESTADO_CIVIL_NEUTRO[client.estado_civil] ?? neutralizar(client.estado_civil ?? ''),
      cpf: formatarCPF(client.cpf ?? ''),
      rg: client.rg ?? '',
      rg_orgao_emissor: client.rg_orgao_emissor ?? '',
      data_nascimento: formatarData(client.data_nascimento ?? ''),
      nome_mae: client.nome_mae ?? '',
      nome_pai: client.nome_pai ?? '',
      nit: client.nit ?? '',
      condicao_menor: ehMenor ? (idade < 16 ? 'impúbere' : 'púbere') : '',
    },

    // Endereço
    endereco: {
      logradouro: client.endereco_logradouro ?? '',
      numero: client.endereco_numero ?? '',
      complemento_formatado: client.endereco_complemento ? `, ${client.endereco_complemento}` : '',
      bairro: client.endereco_bairro ?? '',
      cidade: client.endereco_cidade ?? '',
      uf: client.endereco_uf ?? '',
      cep: formatarCEP(client.endereco_cep ?? ''),
    },

    // Imóvel
    imovel: {
      cedido: imovelCedido,
      proprietario_nome: imovelRaw.proprietario_nome ?? '',
    },

    // Representante legal (menores)
    representante: {
      nome_completo: (ctx?.representante_legal as Record<string, string>)?.nome_completo ?? '',
      cpf: formatarCPF((ctx?.representante_legal as Record<string, string>)?.cpf ?? ''),
      rg: (ctx?.representante_legal as Record<string, string>)?.rg ?? '',
      parentesco: (ctx?.representante_legal as Record<string, string>)?.parentesco ?? '',
    },

    // Dependentes (loop)
    dependentes,

    // Cônjuge
    conjuge: {
      nome_completo: (ctx?.conjuge as Record<string, string>)?.nome_completo ?? '',
      data_nascimento: formatarData((ctx?.conjuge as Record<string, string>)?.data_nascimento ?? ''),
    },

    // Separação
    separacao: {
      data: '',
      recebe_pensao: false,
      valor_pensao: '',
    },

    // Empresa MEI
    empresa: {
      cnpj: (ctx?.empresa_mei as Record<string, string>)?.cnpj ?? '',
      razao_social: (ctx?.empresa_mei as Record<string, string>)?.razao_social ?? '',
      cnae: (ctx?.empresa_mei as Record<string, string>)?.cnae ?? '',
      ramo: (ctx?.empresa_mei as Record<string, string>)?.ramo ?? '',
      data_abertura: formatarData((ctx?.empresa_mei as Record<string, string>)?.data_abertura ?? ''),
      data_inicio_inatividade: formatarData((ctx?.empresa_mei as Record<string, string>)?.data_inicio_inatividade ?? ''),
    },

    // Testemunhas (loop — preenchidas via dados do processo futuramente)
    testemunhas: [],

    // Processo
    processo: {
      tipo_beneficio_descricao: tipoInfo.descricao,
      objeto_procuracao: tipoInfo.objeto,
    },

    // Honorários
    honorarios: {
      qtd_salarios: 3,
      qtd_salarios_extenso: 'três',
      percentual_padrao: 30,
      percentual_recurso: 40,
      valor_fixo: '',
      valor_fixo_extenso: '',
      percentual_padrao_extenso: 'trinta por cento',
      percentual_recurso_extenso: 'quarenta por cento',
    },
    multa: {
      qtd_salarios_minimos: 3,
      qtd_salarios_minimos_extenso: 'três',
    },

    // Escritório
    escritorio: {
      adv1_nome: settings?.advogada_principal_nome ?? '',
      adv1_cpf: settings?.advogada_principal_cpf ?? '',
      adv1_oab: settings?.advogada_principal_oab ?? '',
      adv1_email: settings?.advogada_principal_email ?? '',
      adv2_nome: settings?.advogada_parceira_nome ?? '',
      adv2_oab: settings?.advogada_parceira_oab ?? '',
      adv2_cpf: settings?.advogada_parceira_cpf ?? '',
      adv2_email: settings?.advogada_parceira_email ?? '',
      endereco_logradouro: settings?.endereco_logradouro ?? '',
      endereco_numero: settings?.endereco_numero ?? '',
      endereco_complemento: settings?.endereco_complemento ?? '',
      endereco_bairro: settings?.endereco_bairro ?? '',
      endereco_cidade: settings?.endereco_cidade ?? '',
      endereco_uf: settings?.endereco_uf ?? '',
      endereco_cep: settings?.endereco_cep ?? '',
      foro_eleito: settings?.foro_eleito ?? '',
    },

    // Documento (data de assinatura)
    doc: {
      cidade_assinatura: `${client.endereco_cidade ?? ''} (${client.endereco_uf ?? ''})`,
      dia_assinatura: String(hoje.getDate()).padStart(2, '0'),
      mes_assinatura_extenso: MESES[hoje.getMonth()],
      mes_assinatura_numero: String(hoje.getMonth() + 1).padStart(2, '0'),
      ano_assinatura: String(hoje.getFullYear()),
    },

    // Checkboxes do Termo INSS
    checkbox,

    // Seleção de advogada
    mostrar_lidiane: advogadas === 'lidiane' || advogadas === 'ambas',
    mostrar_alcione: advogadas === 'alcione' || advogadas === 'ambas',
    tem_duas_advogadas: advogadas === 'ambas',
  };

  if (!cenario) return baseContext;


  const overrides = getCenarioContextOverrides(cenario);
  return {
    ...baseContext,
    ...overrides,
    processo: overrides.processo ?? baseContext.processo,
  };
}

// ─── Tipos públicos ───────────────────────────────────────────────────────────

export type BeneficioId =
  | 'bpc'
  | 'aposentadoria_idade'
  | 'mandado_seguranca'
  | 'pensao_morte';

export type PerfilId =
  | 'adulto_capaz'
  | 'a_rogo'
  | 'menor_impubere'
  | 'menor_pubere'
  | 'incapaz_curador';

export type GatilhoId =
  | 'imovel_terceiro'
  | 'mei_inativo'
  | 'separado_de_fato'
  | 'tem_representacao_legal';

export type NivelAlerta = 'erro' | 'aviso' | 'info';

export interface Cenario {
  beneficio: BeneficioId;
  perfil: PerfilId;
  gatilhos: GatilhoId[];
}

export interface Alerta {
  nivel: NivelAlerta;
  codigo: string;
  mensagem: string;
  campo_relacionado?: string;
}

export interface PacoteDocumental {
  cenario: Cenario;
  /** Códigos dos templates, na ordem canônica de geração (spec 4.5) */
  codigos: string[];
  fonte: Record<string, 'cadeia_minima' | 'modular'>;
  alertas: Alerta[];
}

// ─── Metadados do catálogo ────────────────────────────────────────────────────

interface TemplateMetadata {
  codigo: string;
  categoria: 'contrato' | 'procuracao' | 'declaracao' | 'termo';
  nome: string;
  /** [] = aplica-se a todos os benefícios */
  beneficios: BeneficioId[];
  /** [] = aplica-se a todos os perfis */
  perfis: PerfilId[];
  /** [] = cadeia mínima; non-empty = modular ativado por gatilho */
  gatilhos: GatilhoId[];
  obrigatorio: boolean;
  /** Ordem canônica na geração (spec 4.5) */
  ordem: number;
}

// Perfis que ativam auto-regra de representação legal
export const PERFIS_MENORES: PerfilId[] = ['menor_impubere', 'menor_pubere', 'incapaz_curador'];

// ─── Catálogo estático (hardcoded nesta fase) ─────────────────────────────────
// Extensão futura: migrar para colunas beneficios[], perfis[], gatilhos[]
// na tabela document_templates do Supabase. O motor não muda.

export const CATALOGO_TEMPLATES: TemplateMetadata[] = [
  // ── Cadeia mínima ──────────────────────────────────────────────────────────
  {
    codigo: '01',
    categoria: 'contrato',
    nome: 'Contrato de Honorários',
    beneficios: ['bpc', 'aposentadoria_idade', 'mandado_seguranca', 'pensao_morte'],
    perfis: [],
    gatilhos: [],
    obrigatorio: true,
    ordem: 1,
  },
  {
    codigo: '02',
    categoria: 'procuracao',
    nome: 'Procuração',
    beneficios: ['bpc', 'aposentadoria_idade', 'mandado_seguranca', 'pensao_morte'],
    perfis: [],
    gatilhos: [],
    obrigatorio: true,
    ordem: 2,
  },
  {
    // Spec 4.1: MS não inclui Termo de Representação INSS (via judicial direta)
    codigo: '05',
    categoria: 'termo',
    nome: 'Termo de Representação INSS',
    beneficios: ['bpc', 'aposentadoria_idade', 'pensao_morte'],
    perfis: [],
    gatilhos: [],
    obrigatorio: true,
    ordem: 3,
  },
  {
    codigo: '03',
    categoria: 'declaracao',
    nome: 'Declaração de Hipossuficiência',
    beneficios: [], // [] = aplica-se a todos os benefícios
    perfis: [],
    gatilhos: [],
    obrigatorio: true,
    ordem: 4,
  },

  // ── Modulares (ativados por gatilhos) ──────────────────────────────────────
  {
    // Ativado pelo gatilho tem_representacao_legal — não se aplica à aposentadoria por idade
    codigo: '15',
    categoria: 'termo',
    nome: 'Termo de Responsabilidade',
    beneficios: ['bpc', 'mandado_seguranca', 'pensao_morte'],
    perfis: [],
    gatilhos: ['tem_representacao_legal'],
    obrigatorio: false,
    ordem: 6,
  },
  {
    codigo: '04',
    categoria: 'declaracao',
    nome: 'Declaração de Residência',
    beneficios: ['bpc', 'aposentadoria_idade', 'pensao_morte'],
    perfis: [],
    gatilhos: ['imovel_terceiro'],
    obrigatorio: false,
    ordem: 5,
  },
  {
    // Spec 4.3: separado_de_fato só se aplica ao BPC.
    // Em outros benefícios o motor gera aviso e omite o documento.
    codigo: '06',
    categoria: 'declaracao',
    nome: 'Declaração de Separação de Fato (Anexo I)',
    beneficios: ['bpc'],
    perfis: [],
    gatilhos: ['separado_de_fato'],
    obrigatorio: false,
    ordem: 7,
  },
  // NOTA: Declaração de Inatividade de Empresa (código '07') ainda não
  // cadastrada no DB. Motor gera aviso 'MEI_TEMPLATE_AUSENTE' quando
  // gatilho mei_inativo é selecionado.
];

// ─── validarCoerencia — funções puras, testáveis independentemente ────────────

export function validarCoerencia(cenario: Cenario): Alerta[] {
  const alertas: Alerta[] = [];
  const { beneficio, perfil, gatilhos } = cenario;

  // Aviso: separado_de_fato fora do BPC → declaração omitida
  if (gatilhos.includes('separado_de_fato') && beneficio !== 'bpc') {
    alertas.push({
      nivel: 'aviso',
      codigo: 'SEPARADO_FATO_FORA_BPC',
      mensagem:
        'A Declaração de Separação de Fato (Anexo I) é específica do BPC e foi omitida. Se relevante para este benefício, comprove a separação de outra forma.',
      campo_relacionado: 'gatilhos[separado_de_fato]',
    });
  }

  // Aviso: mei_inativo — template não cadastrado no DB ainda
  if (gatilhos.includes('mei_inativo')) {
    alertas.push({
      nivel: 'aviso',
      codigo: 'MEI_TEMPLATE_AUSENTE',
      mensagem:
        'Declaração de Inatividade de Empresa ainda não cadastrada no sistema. Adicione o template (código 07) para incluí-la automaticamente no futuro.',
      campo_relacionado: 'gatilhos[mei_inativo]',
    });
  }

  // Info: perfil de menor/incapaz sem gatilho tem_representacao_legal
  if (PERFIS_MENORES.includes(perfil) && !gatilhos.includes('tem_representacao_legal')) {
    alertas.push({
      nivel: 'info',
      codigo: 'REPRESENTACAO_LEGAL_GATILHO_AUSENTE',
      mensagem:
        'Perfil de menor ou incapaz: verifique se há representante legal e, se sim, ative o gatilho "tem_representacao_legal" para incluir o Termo de Responsabilidade (código 15).',
      campo_relacionado: 'gatilhos',
    });
  }

  return alertas;
}

// ─── montarPacote — motor principal ──────────────────────────────────────────

export function montarPacote(cenario: Cenario): PacoteDocumental {
  const { beneficio, gatilhos } = cenario;
  const fonte: Record<string, 'cadeia_minima' | 'modular'> = {};

  // beneficios: [] significa "aplica-se a todos os benefícios"
  const matchesBeneficio = (t: TemplateMetadata) =>
    t.beneficios.length === 0 || t.beneficios.includes(beneficio);

  // Cadeia mínima: templates sem gatilhos que se aplicam a este benefício
  const cadeiaMinima = CATALOGO_TEMPLATES.filter(
    (t) => t.gatilhos.length === 0 && matchesBeneficio(t),
  );

  // Modulares: ativados por gatilhos do cenário E aplicáveis ao benefício
  const modulares = CATALOGO_TEMPLATES.filter(
    (t) =>
      t.gatilhos.length > 0 &&
      t.gatilhos.some((g) => gatilhos.includes(g)) &&
      matchesBeneficio(t),
  );

  // Monta lista completa, ordena pela ordem canônica (spec 4.5)
  const todos = [...cadeiaMinima, ...modulares].sort((a, b) => a.ordem - b.ordem);
  todos.forEach((t) => {
    fonte[t.codigo] = t.gatilhos.length === 0 ? 'cadeia_minima' : 'modular';
  });

  const codigos = todos.map((t) => t.codigo);

  // Valida coerência e coleta alertas
  const alertas = validarCoerencia(cenario);

  // Info: pacote com menos de 3 documentos
  if (codigos.length < 3) {
    alertas.push({
      nivel: 'info',
      codigo: 'PACOTE_PEQUENO',
      mensagem: `Pacote contém apenas ${codigos.length} documento(s). Verifique se o conjunto está completo para este tipo de ação.`,
    });
  }

  return { cenario, codigos, fonte, alertas };
}

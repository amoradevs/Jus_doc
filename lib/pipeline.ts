/**
 * Etapas do pipeline e checklist padrão de documentos por tipo de caso.
 */

export const ETAPAS_PIPELINE = [
  { value: 'triagem',          label: 'Triagem',          color: 'slate',   icon: '📋' },
  { value: 'consulta',         label: 'Consulta',         color: 'violet',  icon: '🗣️' },
  { value: 'documentos',       label: 'Documentos',       color: 'amber',   icon: '📄' },
  { value: 'aguardando_inss',  label: 'Aguardando INSS',  color: 'blue',    icon: '🏛️' },
  { value: 'pericia',          label: 'Perícia',          color: 'orange',   icon: '🩺' },
  { value: 'judicial',         label: 'Judicial',         color: 'rose',    icon: '⚖️' },
  { value: 'concedido',        label: 'Concedido',        color: 'emerald', icon: '✅' },
  { value: 'encerrado',        label: 'Encerrado',        color: 'gray',    icon: '📁' },
] as const;

export type EtapaPipeline = (typeof ETAPAS_PIPELINE)[number]['value'];

export function labelEtapa(value: string | null | undefined): string {
  if (!value) return 'Triagem';
  return ETAPAS_PIPELINE.find((e) => e.value === value)?.label ?? value;
}

export function etapaInfo(value: string) {
  return ETAPAS_PIPELINE.find((e) => e.value === value) ?? ETAPAS_PIPELINE[0];
}

// ── Checklist padrão de documentos ──────────────────────────────────

export type CategoriaDocumento = 'identificacao' | 'renda' | 'medico' | 'familia' | 'inss' | 'geral';

export interface DocumentoChecklist {
  nome: string;
  categoria: CategoriaDocumento;
  obrigatorio: boolean;
}

export const CATEGORIAS_DOCUMENTO: Record<CategoriaDocumento, string> = {
  identificacao: '🪪 Identificação',
  renda:         '💰 Renda',
  medico:        '🏥 Médico',
  familia:       '👨‍👩‍👧 Família',
  inss:          '🏛️ INSS',
  geral:         '📎 Geral',
};

/**
 * Checklist padrão de documentos para BPC/LOAS.
 * Pode ser estendida para outros tipos de pedido.
 */
export const CHECKLIST_BPC: DocumentoChecklist[] = [
  // Identificação
  { nome: 'CPF do requerente',             categoria: 'identificacao', obrigatorio: true },
  { nome: 'RG do requerente',              categoria: 'identificacao', obrigatorio: true },
  { nome: 'Certidão de nascimento/casamento', categoria: 'identificacao', obrigatorio: true },
  { nome: 'Comprovante de residência',     categoria: 'identificacao', obrigatorio: true },
  { nome: 'Foto 3x4 (se necessário)',      categoria: 'identificacao', obrigatorio: false },

  // Renda
  { nome: 'CPFs de todos do grupo familiar',       categoria: 'renda', obrigatorio: true },
  { nome: 'Contracheques dos familiares',          categoria: 'renda', obrigatorio: true },
  { nome: 'Extrato bancário (últimos 3 meses)',    categoria: 'renda', obrigatorio: false },
  { nome: 'Declaração de renda informal',          categoria: 'renda', obrigatorio: false },
  { nome: 'Comprovante Bolsa Família / Auxílio Brasil', categoria: 'renda', obrigatorio: false },

  // Médico (para PcD)
  { nome: 'Laudo médico com CID atualizado',       categoria: 'medico', obrigatorio: true },
  { nome: 'Exames complementares',                 categoria: 'medico', obrigatorio: false },
  { nome: 'Relatório de tratamento/terapia',        categoria: 'medico', obrigatorio: false },
  { nome: 'Receitas médicas recentes',              categoria: 'medico', obrigatorio: false },
  { nome: 'Laudos de internação (se houver)',       categoria: 'medico', obrigatorio: false },

  // Família
  { nome: 'Certidão de nascimento dos filhos',     categoria: 'familia', obrigatorio: false },
  { nome: 'Declaração escolar (menores)',           categoria: 'familia', obrigatorio: false },
  { nome: 'Declaração de composição familiar',     categoria: 'familia', obrigatorio: true },

  // INSS
  { nome: 'CadÚnico atualizado',                   categoria: 'inss', obrigatorio: true },
  { nome: 'Extrato CNIS (Meu INSS)',               categoria: 'inss', obrigatorio: true },
  { nome: 'Protocolo de requerimento anterior',     categoria: 'inss', obrigatorio: false },
  { nome: 'Carta de indeferimento (se recurso)',    categoria: 'inss', obrigatorio: false },
];

/**
 * Retorna o checklist padrão conforme tipo de pedido.
 */
export function checklistPadrao(tipoPedido: string | null | undefined): DocumentoChecklist[] {
  // Para o MVP, BPC tem checklist completo; outros usam os itens básicos
  if (tipoPedido === 'bpc_loas') return CHECKLIST_BPC;

  // Padrão mínimo para qualquer tipo
  return CHECKLIST_BPC.filter((d) => d.categoria === 'identificacao' || d.categoria === 'inss');
}

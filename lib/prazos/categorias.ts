// Tokens nomeados para as 4 categorias de prazo — seção 3.2 da especificação.
// Usar APENAS estas classes em componentes; nunca hardcode hexadecimais.

export const CATEGORIAS_PRAZO = [
  { value: 'administrativo_inss', label: 'Administrativo INSS',   descricao: 'Prazo fatal junto ao INSS' },
  { value: 'judicial',            label: 'Judicial',              descricao: 'Prazo do CPC (dias úteis)' },
  { value: 'comercial_interno',   label: 'Compromisso Interno',   descricao: 'Prazos e follow-ups internos' },
  { value: 'evento',              label: 'Evento',                descricao: 'Audiência, perícia, reunião' },
] as const;

export type CategoriaPrazo = (typeof CATEGORIAS_PRAZO)[number]['value'];

// Tailwind class tokens por categoria — sem hexadecimais espalhados no código
export const CATEGORIA_STYLE: Record<CategoriaPrazo, {
  bg: string;
  text: string;
  border: string;
  dot: string;
  badgeBg: string;
  badgeText: string;
  cardBorder: string;  // borda esquerda do card do pipeline
}> = {
  administrativo_inss: {
    bg:          'bg-orange-50 dark:bg-orange-950/30',
    text:        'text-orange-700 dark:text-orange-400',
    border:      'border-orange-200 dark:border-orange-800',
    dot:         'bg-orange-600',
    badgeBg:     'bg-orange-100 dark:bg-orange-900/40',
    badgeText:   'text-orange-700 dark:text-orange-300',
    cardBorder:  'border-l-orange-600',
  },
  judicial: {
    bg:          'bg-violet-50 dark:bg-violet-950/30',
    text:        'text-violet-700 dark:text-violet-400',
    border:      'border-violet-200 dark:border-violet-800',
    dot:         'bg-violet-700',
    badgeBg:     'bg-violet-100 dark:bg-violet-900/40',
    badgeText:   'text-violet-700 dark:text-violet-300',
    cardBorder:  'border-l-violet-700',
  },
  comercial_interno: {
    bg:          'bg-amber-50 dark:bg-amber-950/30',
    text:        'text-amber-700 dark:text-amber-400',
    border:      'border-amber-200 dark:border-amber-800',
    dot:         'bg-amber-600',
    badgeBg:     'bg-amber-100 dark:bg-amber-900/40',
    badgeText:   'text-amber-700 dark:text-amber-300',
    cardBorder:  'border-l-amber-600',
  },
  evento: {
    bg:          'bg-blue-50 dark:bg-blue-950/30',
    text:        'text-blue-700 dark:text-blue-400',
    border:      'border-blue-200 dark:border-blue-800',
    dot:         'bg-blue-700',
    badgeBg:     'bg-blue-100 dark:bg-blue-900/40',
    badgeText:   'text-blue-700 dark:text-blue-300',
    cardBorder:  'border-l-blue-700',
  },
};

// Sugestões de tipo por categoria (seção 3.5)
export const TIPOS_SUGERIDOS: Record<CategoriaPrazo, { tipo: string; diasPadrao?: number; diasUteis?: boolean }[]> = {
  administrativo_inss: [
    { tipo: 'Resposta a exigência',               diasPadrao: 30, diasUteis: false },
    { tipo: 'Recurso ao CRPS',                    diasPadrao: 30, diasUteis: false },
    { tipo: 'Recurso ao Conselho de Recursos',    diasPadrao: 30, diasUteis: false },
  ],
  judicial: [
    { tipo: 'Contestação',                        diasPadrao: 15, diasUteis: true },
    { tipo: 'Manifestação sobre laudo pericial',  diasPadrao: 15, diasUteis: true },
    { tipo: 'Apelação',                           diasPadrao: 15, diasUteis: true },
    { tipo: 'Embargos de declaração',             diasPadrao: 5,  diasUteis: true },
    { tipo: 'Réplica',                            diasPadrao: 15, diasUteis: true },
    { tipo: 'Audiência de instrução',             diasPadrao: undefined },
  ],
  comercial_interno: [
    { tipo: 'Retorno ao cliente' },
    { tipo: 'Atualização de andamento' },
    { tipo: 'Follow-up' },
    { tipo: 'Reunião agendada' },
  ],
  evento: [
    { tipo: 'Audiência' },
    { tipo: 'Perícia médica' },
    { tipo: 'Perícia social' },
    { tipo: 'Reunião com cliente' },
  ],
};

export function labelCategoria(value: string): string {
  return CATEGORIAS_PRAZO.find((c) => c.value === value)?.label ?? value;
}

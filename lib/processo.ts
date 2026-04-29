export const TIPOS_PEDIDO = [
  { value: 'bpc_loas',           label: 'BPC / LOAS' },
  { value: 'apos_invalidez',     label: 'Aposentadoria por Invalidez' },
  { value: 'apos_incapacidade',  label: 'Aposentadoria por Incapacidade Permanente' },
  { value: 'aux_incapacidade',   label: 'Auxílio por Incapacidade Temporária (Aux. Doença)' },
  { value: 'apos_tempo',         label: 'Aposentadoria por Tempo de Contribuição' },
  { value: 'apos_idade',         label: 'Aposentadoria por Idade (Urbana)' },
  { value: 'apos_rural',         label: 'Aposentadoria Rural (FUNRURAL)' },
  { value: 'pensao_morte',       label: 'Pensão por Morte' },
  { value: 'salario_maternidade',label: 'Salário Maternidade' },
  { value: 'aux_reclusao',       label: 'Auxílio Reclusão' },
  { value: 'mandado_seguranca',  label: 'Mandado de Segurança' },
  { value: 'revisao',            label: 'Revisão de Benefício' },
  { value: 'recurso',            label: 'Recurso Administrativo (INSS)' },
  { value: 'tutela',             label: 'Tutela Antecipada / Liminar' },
  { value: 'cumprimento',        label: 'Cumprimento de Sentença' },
  { value: 'outro',              label: 'Outro' },
] as const;

export type TipoPedido = (typeof TIPOS_PEDIDO)[number]['value'];

export function labelTipoPedido(value: string | null | undefined): string {
  if (!value) return '—';
  return TIPOS_PEDIDO.find((t) => t.value === value)?.label ?? value;
}

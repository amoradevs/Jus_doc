// ── Enum novo (tabela processos) ─────────────────────────────────────────────

export const TIPOS_BENEFICIO = [
  { value: 'bpc_idoso',                        label: 'BPC/LOAS — Idoso' },
  { value: 'bpc_deficiente_adulto',             label: 'BPC/LOAS — Adulto com Deficiência' },
  { value: 'bpc_deficiente_menor_16',           label: 'BPC/LOAS — Menor de 16 anos' },
  { value: 'bpc_deficiente_16_18',              label: 'BPC/LOAS — 16 a 18 anos' },
  { value: 'aposentadoria_idade_urbana',        label: 'Aposentadoria por Idade (Urbana)' },
  { value: 'aposentadoria_idade_rural',         label: 'Aposentadoria por Idade (Rural)' },
  { value: 'aposentadoria_tempo_contribuicao',  label: 'Aposentadoria por Tempo de Contribuição' },
  { value: 'pensao_morte',                      label: 'Pensão por Morte' },
  { value: 'auxilio_doenca',                    label: 'Auxílio por Incapacidade (Aux. Doença)' },
  { value: 'mandado_seguranca',                 label: 'Mandado de Segurança' },
] as const;

export type TipoBeneficio = (typeof TIPOS_BENEFICIO)[number]['value'];

export function labelTipoBeneficio(value: string | null | undefined): string {
  if (!value) return '—';
  return TIPOS_BENEFICIO.find((t) => t.value === value)?.label ?? value;
}

export const STATUS_RESULTADO = [
  { value: 'em_andamento',          label: 'Em andamento' },
  { value: 'exigencia',             label: 'Exigência' },
  { value: 'deferido',              label: 'Deferido' },
  { value: 'indeferido',            label: 'Indeferido' },
  { value: 'recurso_administrativo',label: 'Recurso Adm.' },
  { value: 'judicializado',         label: 'Judicializado' },
  { value: 'arquivado',             label: 'Arquivado' },
] as const;

export type StatusResultado = (typeof STATUS_RESULTADO)[number]['value'];

export function labelStatusResultado(value: string | null | undefined): string {
  if (!value) return '—';
  return STATUS_RESULTADO.find((s) => s.value === value)?.label ?? value;
}

// ── Enum legado (mantido para compatibilidade com código não migrado) ─────────

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

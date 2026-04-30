import { parseISO } from 'date-fns';
import type { Sexo, ResultadoRegra } from '../tipos';
import { somarPeriodosContributivos, projetarDataCumprimento, formatarPeriodoContributivo } from '../utils/tempo';
import type { PeriodoContributivo } from '../tipos';

// EC 103/2019 Art. 17 — Pedágio 50%
// Elegível: quem, em 13/11/2019, já tinha (requisito - 2 anos) de contribuição.
// Requisito: 30a (F) ou 35a (M)
// Total necessário = requisito + 50% × tempo_faltante_em_13nov2019
// Sem exigência de idade mínima.

const REFORMA = parseISO('2019-11-13');

export function calcularArt17Pedagio50(
  der: Date,
  dataNascimento: Date,
  totalDiasDer: number,
  sexo: Sexo,
  filiadoAntesDaReforma: boolean,
  periodos: PeriodoContributivo[],
): ResultadoRegra {
  if (!filiadoAntesDaReforma) {
    return {
      elegivel: false,
      dataCumprimento: null,
      observacao: 'Regra de transição — exige filiação antes de 13/11/2019.',
    };
  }

  const requisitoDias = (sexo === 'F' ? 30 : 35) * 365.25;
  const elegibilidadeMinDias = requisitoDias - 2 * 365.25;

  // Tempo contribuído em 13/11/2019 (data-base da reforma, não a DER)
  const diasNaReforma = somarPeriodosContributivos(periodos, REFORMA);

  if (diasNaReforma < elegibilidadeMinDias) {
    return {
      elegivel: false,
      dataCumprimento: null,
      observacao: `Não elegível: em 13/11/2019 tinha ${formatarPeriodoContributivo(diasNaReforma)} de contribuição — precisaria de ${formatarPeriodoContributivo(elegibilidadeMinDias)} (${sexo === 'F' ? '28' : '33'} anos).`,
    };
  }

  const faltanteDias = Math.max(0, requisitoDias - diasNaReforma);
  // Total necessário = requisito + 50% do faltante em 13/11/2019
  const totalNecessarioDias = requisitoDias + faltanteDias * 0.5;

  const dataCumprimento = projetarDataCumprimento(
    der,
    dataNascimento,
    totalDiasDer,
    80,
    (contribDias) => contribDias >= totalNecessarioDias,
  );

  const pedagioFormatado = formatarPeriodoContributivo(faltanteDias * 0.5);
  const totalFormatado = formatarPeriodoContributivo(totalNecessarioDias);

  if (!dataCumprimento) {
    return {
      elegivel: true,
      dataCumprimento: null,
      observacao: `Pedágio 50%: ${pedagioFormatado} adicionais. Total necessário: ${totalFormatado}. Não atingido no horizonte de projeção.`,
    };
  }

  return {
    elegivel: true,
    dataCumprimento: dataCumprimento.toISOString().split('T')[0],
    observacao: `EC 103/2019, Art. 17. Pedágio de 50%: ${pedagioFormatado}. Total necessário: ${totalFormatado}. Sem exigência de idade mínima.`,
  };
}

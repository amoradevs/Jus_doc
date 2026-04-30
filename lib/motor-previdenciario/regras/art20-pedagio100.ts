import { parseISO } from 'date-fns';
import type { Sexo, ResultadoRegra, PeriodoContributivo } from '../tipos';
import { somarPeriodosContributivos, projetarDataCumprimento, formatarPeriodoContributivo } from '../utils/tempo';

// EC 103/2019 Art. 20 — Pedágio 100% (regra de transição)
// Aplica-se quando, em 13/11/2019, o segurado tinha MENOS de (requisito - 2 anos).
// Ou seja: não elegível ao Art. 17.
// Total necessário = requisito + 100% do faltante em 13/11/2019.
// Sem exigência de idade mínima.

const REFORMA = parseISO('2019-11-13');

export function calcularArt20Pedagio100(
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
  const elegibilidadeArt17MinDias = requisitoDias - 2 * 365.25;

  // Tempo contribuído em 13/11/2019 (data-base da reforma)
  const diasNaReforma = somarPeriodosContributivos(periodos, REFORMA);

  if (diasNaReforma >= elegibilidadeArt17MinDias) {
    return {
      elegivel: false,
      dataCumprimento: null,
      observacao: `Não se aplica: o segurado é elegível ao Art. 17 (Pedágio 50%), pois tinha ${formatarPeriodoContributivo(diasNaReforma)} em 13/11/2019.`,
    };
  }

  if (diasNaReforma >= requisitoDias) {
    // Já tinha o requisito integral — sem pedágio
    return {
      elegivel: true,
      dataCumprimento: der.toISOString().split('T')[0],
      observacao: 'Já havia cumprido o tempo de contribuição antes da reforma.',
    };
  }

  const faltanteDias = requisitoDias - diasNaReforma;
  // Pedágio de 100%: paga o dobro do faltante na reforma
  const totalNecessarioDias = requisitoDias + faltanteDias;

  const dataCumprimento = projetarDataCumprimento(
    der,
    dataNascimento,
    totalDiasDer,
    120,
    (contribDias) => contribDias >= totalNecessarioDias,
  );

  const pedagioFormatado = formatarPeriodoContributivo(faltanteDias);
  const totalFormatado = formatarPeriodoContributivo(totalNecessarioDias);

  if (!dataCumprimento) {
    return {
      elegivel: true,
      dataCumprimento: null,
      observacao: `Pedágio 100%: ${pedagioFormatado} adicionais. Total: ${totalFormatado}. Não atingido no horizonte de projeção.`,
    };
  }

  return {
    elegivel: true,
    dataCumprimento: dataCumprimento.toISOString().split('T')[0],
    observacao: `EC 103/2019, Art. 20. Pedágio de 100%: ${pedagioFormatado}. Total necessário: ${totalFormatado}. Sem exigência de idade mínima.`,
  };
}

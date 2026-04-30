import type { Sexo, ResultadoRegra } from '../tipos';
import { projetarDataCumprimento } from '../utils/tempo';

// EC 103/2019 Art. 16 — Idade progressiva (regra de transição)
// Requisito fixo de contribuição: 30a (F) ou 35a (M)
// Idade mínima cresce +6 meses por ano a partir de 2019

function idadeMinEmMeses(sexo: Sexo, ano: number): number {
  if (sexo === 'F') {
    if (ano <= 2019) return 56 * 12;
    if (ano >= 2031) return 62 * 12;
    return 56 * 12 + (ano - 2019) * 6;
  } else {
    if (ano <= 2019) return 61 * 12;
    if (ano >= 2027) return 65 * 12;
    return 61 * 12 + (ano - 2019) * 6;
  }
}

export function calcularArt16IdadeProgressiva(
  der: Date,
  dataNascimento: Date,
  totalDiasDer: number,
  sexo: Sexo,
  filiadoAntesDaReforma: boolean,
): ResultadoRegra & { idadeNecessaria?: string } {
  if (!filiadoAntesDaReforma) {
    return {
      elegivel: false,
      dataCumprimento: null,
      observacao: 'Regra de transição — exige filiação antes de 13/11/2019.',
    };
  }

  const requisitoDias = (sexo === 'F' ? 30 : 35) * 365.25;

  const dataCumprimento = projetarDataCumprimento(
    der,
    dataNascimento,
    totalDiasDer,
    80,
    (contribDias, idadeDias, ano) => {
      const idadeEmMeses = idadeDias / 30.4375;
      return contribDias >= requisitoDias && idadeEmMeses >= idadeMinEmMeses(sexo, ano);
    },
  );

  if (!dataCumprimento) {
    return {
      elegivel: true,
      dataCumprimento: null,
      observacao: 'Não será atingido dentro do horizonte de projeção.',
    };
  }

  const idadeMin = idadeMinEmMeses(sexo, dataCumprimento.getFullYear());
  const anos = Math.floor(idadeMin / 12);
  const meses = idadeMin % 12;
  const idadeNecessaria = meses > 0 ? `${anos} anos e ${meses} meses` : `${anos} anos`;

  return {
    elegivel: true,
    dataCumprimento: dataCumprimento.toISOString().split('T')[0],
    observacao: `EC 103/2019, Art. 16. Idade mínima em ${dataCumprimento.getFullYear()}: ${idadeNecessaria}. Tempo de contribuição: ${sexo === 'F' ? '30' : '35'} anos.`,
    idadeNecessaria,
  };
}

import { parseISO } from 'date-fns';
import type { Sexo } from '../tipos';
import type { ResultadoRegra } from '../tipos';
import { projetarDataCumprimento } from '../utils/tempo';

// EC 103/2019 Art. 15 — Sistema de Pontos (regra de transição)
// Pontos = anos de contribuição (inteiros) + anos de idade (inteiros)
// Tabela de limiares progressivos por ano e sexo

function limiarPontos(sexo: Sexo, ano: number): number {
  if (sexo === 'F') {
    if (ano <= 2019) return 86;
    if (ano >= 2033) return 100;
    return 86 + (ano - 2019);
  } else {
    if (ano <= 2019) return 96;
    if (ano >= 2028) return 105;
    return 96 + (ano - 2019);
  }
}

export function calcularArt15Pontos(
  der: Date,
  dataNascimento: Date,
  totalDiasDer: number,
  sexo: Sexo,
  filiadoAntesDaReforma: boolean,
): ResultadoRegra & { pontosNaDer?: number; pontosNecessariosNaDer?: number } {
  if (!filiadoAntesDaReforma) {
    return {
      elegivel: false,
      dataCumprimento: null,
      observacao: 'Regra de transição — exige filiação antes de 13/11/2019.',
    };
  }

  const minimoContribAnos = sexo === 'F' ? 15 : 20;

  // Pontos e limiar na DER (informativo)
  const idadeDiasDer = Math.floor(der.getTime() / 86400000) - Math.floor(dataNascimento.getTime() / 86400000);
  const contribAnosDer = Math.floor(totalDiasDer / 365.25);
  const idadeAnosDer = Math.floor(idadeDiasDer / 365.25);
  const pontosNaDer = contribAnosDer + idadeAnosDer;
  const pontosNecessariosNaDer = limiarPontos(sexo, der.getFullYear());

  const dataCumprimento = projetarDataCumprimento(
    der,
    dataNascimento,
    totalDiasDer,
    80,
    (contribDias, idadeDias, ano) => {
      const anosContrib = Math.floor(contribDias / 365.25);
      const anosIdade = Math.floor(idadeDias / 365.25);
      const pontos = anosContrib + anosIdade;
      return pontos >= limiarPontos(sexo, ano) && anosContrib >= minimoContribAnos;
    },
  );

  if (!dataCumprimento) {
    return {
      elegivel: true,
      dataCumprimento: null,
      observacao: 'Não será atingido dentro do horizonte de projeção.',
      pontosNaDer,
      pontosNecessariosNaDer,
    };
  }

  return {
    elegivel: true,
    dataCumprimento: dataCumprimento.toISOString().split('T')[0],
    observacao: `Regra de pontos EC 103/2019, Art. 15. Limiar em ${dataCumprimento.getFullYear()}: ${limiarPontos(sexo, dataCumprimento.getFullYear())} pontos.`,
    pontosNaDer,
    pontosNecessariosNaDer,
  };
}

export { parseISO };

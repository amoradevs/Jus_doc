import type { Sexo, ResultadoRegra } from '../tipos';
import { projetarDataCumprimento } from '../utils/tempo';

// EC 103/2019 Art. 18 — Aposentadoria por Idade (regra permanente)
// Mulher: 62 anos + 15 anos de contribuição (180 meses)
// Homem:  65 anos + 20 anos de contribuição (240 meses)
// Aplicável a todos (não é regra de transição).

export function calcularArt18AposIdade(
  der: Date,
  dataNascimento: Date,
  totalDiasDer: number,
  sexo: Sexo,
): ResultadoRegra {
  const idadeMinDias = (sexo === 'F' ? 62 : 65) * 365.25;
  const minimoContribDias = (sexo === 'F' ? 15 : 20) * 365.25;

  const dataCumprimento = projetarDataCumprimento(
    der,
    dataNascimento,
    totalDiasDer,
    80,
    (contribDias, idadeDias) =>
      idadeDias >= idadeMinDias && contribDias >= minimoContribDias,
  );

  const idadeMin = sexo === 'F' ? '62 anos' : '65 anos';
  const contribMin = sexo === 'F' ? '15 anos' : '20 anos';

  if (!dataCumprimento) {
    return {
      elegivel: true,
      dataCumprimento: null,
      observacao: `Aposentadoria por Idade: ${idadeMin} e ${contribMin} de contribuição. Não atingido no horizonte.`,
    };
  }

  return {
    elegivel: true,
    dataCumprimento: dataCumprimento.toISOString().split('T')[0],
    observacao: `EC 103/2019, Art. 18 (regra permanente). Exige ${idadeMin} e ${contribMin} de contribuição.`,
  };
}

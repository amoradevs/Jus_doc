import type { SalarioContributivo, Sexo } from '../tipos';

// Teto do INSS 2025 (atualizado por portaria anual — ajustar conforme portaria vigente)
export const TETO_INSS_2025 = 8_157.41;

// EC 103/2019: média de 100% dos salários de contribuição
export function calcularSalarioBeneficio(salarios: SalarioContributivo[]): {
  media: number;
  tetoINSS: number;
  salarioBeneficio: number;
} {
  const teto = TETO_INSS_2025;

  if (salarios.length === 0) {
    return { media: 0, tetoINSS: teto, salarioBeneficio: 0 };
  }

  const soma = salarios.reduce((acc, s) => acc + s.valor, 0);
  const media = soma / salarios.length;
  const salarioBeneficio = Math.min(media, teto);

  return {
    media: arredondar(media),
    tetoINSS: teto,
    salarioBeneficio: arredondar(salarioBeneficio),
  };
}

// EC 103/2019: coeficiente = 60% + 2% por ano além do mínimo exigido
// Mínimo: 15 anos (F) ou 20 anos (M)
export function aplicarCoeficienteEC103(totalDiasDer: number, sexo: Sexo): number {
  const anosContrib = totalDiasDer / 365.25;
  const minimo = sexo === 'F' ? 15 : 20;
  const excedente = Math.max(0, anosContrib - minimo);
  const coeficiente = 0.6 + excedente * 0.02;
  // Não há teto legal explícito para o coeficiente, mas o benefício é limitado pelo teto do INSS
  return Math.min(arredondar(coeficiente, 4), 1);
}

function arredondar(valor: number, casas = 2): number {
  const fator = Math.pow(10, casas);
  return Math.round(valor * fator) / fator;
}

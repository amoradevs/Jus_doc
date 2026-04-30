import { parseISO } from 'date-fns';
import type { EntradaCalculoPrevidenciario, ResultadoCalculo } from './tipos';
import { somarPeriodosContributivos, formatarPeriodoContributivo } from './utils/tempo';
import { calcularArt15Pontos } from './regras/art15-pontos';
import { calcularArt16IdadeProgressiva } from './regras/art16-idade';
import { calcularArt17Pedagio50 } from './regras/art17-pedagio50';
import { calcularArt18AposIdade } from './regras/art18-idade';
import { calcularArt20Pedagio100 } from './regras/art20-pedagio100';
import { calcularSalarioBeneficio, aplicarCoeficienteEC103 } from './calculos/salario-beneficio';

export type { EntradaCalculoPrevidenciario, ResultadoCalculo };
export type { PeriodoContributivo, SalarioContributivo, Sexo, ResultadoRegra } from './tipos';

export function executarCalculoPrevidenciario(
  entrada: EntradaCalculoPrevidenciario,
): ResultadoCalculo {
  const der = parseISO(entrada.der);
  const dataNascimento = parseISO(entrada.dataNascimento);
  const { sexo, filiadoAntesDaReforma, periodos, salarios } = entrada;

  // Apenas períodos RGPS e facultativo contam para o RGPS.
  // RPPS exige averbação formal (certidão de tempo de serviço) — alertamos mas não excluímos
  // automaticamente para não prejudicar o cálculo do planejamento.
  const totalDiasDer = somarPeriodosContributivos(periodos, der);

  const art15Pontos = calcularArt15Pontos(der, dataNascimento, totalDiasDer, sexo, filiadoAntesDaReforma);
  const art16IdadeProgressiva = calcularArt16IdadeProgressiva(der, dataNascimento, totalDiasDer, sexo, filiadoAntesDaReforma);
  const art17Pedagio50 = calcularArt17Pedagio50(der, dataNascimento, totalDiasDer, sexo, filiadoAntesDaReforma, periodos);
  const art18AposIdade = calcularArt18AposIdade(der, dataNascimento, totalDiasDer, sexo);
  const art20Pedagio100 = calcularArt20Pedagio100(der, dataNascimento, totalDiasDer, sexo, filiadoAntesDaReforma, periodos);

  const { salarioBeneficio, tetoINSS } = calcularSalarioBeneficio(salarios);
  const coeficienteEC103 = aplicarCoeficienteEC103(totalDiasDer, sexo);
  const beneficioMensal = Math.round(salarioBeneficio * coeficienteEC103 * 100) / 100;

  return {
    totalContributivoDias: totalDiasDer,
    totalContributivoFormatado: formatarPeriodoContributivo(totalDiasDer),
    art15Pontos,
    art16IdadeProgressiva,
    art17Pedagio50,
    art18AposIdade,
    art20Pedagio100,
    salarioBeneficio,
    coeficienteEC103,
    beneficioMensal,
    tetoINSS,
  };
}

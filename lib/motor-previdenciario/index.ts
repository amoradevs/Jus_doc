import { parseISO } from 'date-fns';
import type { EntradaCalculoPrevidenciario, ResultadoCalculo, MelhorOpcao } from './tipos';
import { somarPeriodosContributivos, formatarPeriodoContributivo, contribDiasEmData } from './utils/tempo';
import { calcularArt15Pontos } from './regras/art15-pontos';
import { calcularArt16IdadeProgressiva } from './regras/art16-idade';
import { calcularArt17Pedagio50 } from './regras/art17-pedagio50';
import { calcularArt18AposIdade } from './regras/art18-idade';
import { calcularArt20Pedagio100 } from './regras/art20-pedagio100';
import { calcularSalarioBeneficio, aplicarCoeficienteEC103 } from './calculos/salario-beneficio';

export type { EntradaCalculoPrevidenciario, ResultadoCalculo, MelhorOpcao };
export type { PeriodoContributivo, SalarioContributivo, Sexo, ResultadoRegra } from './tipos';

export function executarCalculoPrevidenciario(
  entrada: EntradaCalculoPrevidenciario,
): ResultadoCalculo {
  const der = parseISO(entrada.der);
  const dataNascimento = parseISO(entrada.dataNascimento);
  const { sexo, filiadoAntesDaReforma, periodos, salarios } = entrada;

  const totalDiasDer = somarPeriodosContributivos(periodos, der);

  const art15Pontos = calcularArt15Pontos(der, dataNascimento, totalDiasDer, sexo, filiadoAntesDaReforma);
  const art16IdadeProgressiva = calcularArt16IdadeProgressiva(der, dataNascimento, totalDiasDer, sexo, filiadoAntesDaReforma);
  const art17Pedagio50 = calcularArt17Pedagio50(der, dataNascimento, totalDiasDer, sexo, filiadoAntesDaReforma, periodos);
  const art18AposIdade = calcularArt18AposIdade(der, dataNascimento, totalDiasDer, sexo);
  const art20Pedagio100 = calcularArt20Pedagio100(der, dataNascimento, totalDiasDer, sexo, filiadoAntesDaReforma, periodos);

  // Encontrar a regra com data de aposentadoria mais próxima
  const todasCandidatas: Array<{ chave: MelhorOpcao; data: string }> = [
    { chave: 'art15' as const, data: art15Pontos.dataCumprimento ?? '' },
    { chave: 'art16' as const, data: art16IdadeProgressiva.dataCumprimento ?? '' },
    { chave: 'art17' as const, data: art17Pedagio50.dataCumprimento ?? '' },
    { chave: 'art18' as const, data: art18AposIdade.dataCumprimento ?? '' },
    { chave: 'art20' as const, data: art20Pedagio100.dataCumprimento ?? '' },
  ];
  const candidatas = todasCandidatas.filter((c) => !!c.data);

  candidatas.sort((a, b) => a.data.localeCompare(b.data));

  const melhorOpcao: MelhorOpcao = candidatas[0]?.chave ?? null;
  const dataMaisProxima: string | null = candidatas[0]?.data ?? null;

  // Benefício: coeficiente na DER (para referência imediata)
  const coeficienteEC103 = aplicarCoeficienteEC103(totalDiasDer, sexo);

  // Coeficiente mais realista: calculado na data da melhor aposentadoria,
  // pois o segurado continuará contribuindo até lá.
  const diasNaMelhorData = dataMaisProxima
    ? contribDiasEmData(totalDiasDer, der, parseISO(dataMaisProxima))
    : totalDiasDer;

  const coeficienteNaAposentadoria = aplicarCoeficienteEC103(diasNaMelhorData, sexo);

  const { salarioBeneficio, tetoINSS } = calcularSalarioBeneficio(salarios);
  const beneficioMensal = Math.round(salarioBeneficio * coeficienteNaAposentadoria * 100) / 100;

  return {
    totalContributivoDias: totalDiasDer,
    totalContributivoFormatado: formatarPeriodoContributivo(totalDiasDer),
    art15Pontos,
    art16IdadeProgressiva,
    art17Pedagio50,
    art18AposIdade,
    art20Pedagio100,
    melhorOpcao,
    dataMaisProxima,
    salarioBeneficio,
    coeficienteEC103,
    coeficienteNaAposentadoria,
    beneficioMensal,
    tetoINSS,
  };
}

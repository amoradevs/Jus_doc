import { parseISO, differenceInDays, addMonths, min as dateMin, max as dateMax, isAfter, isBefore, isEqual } from 'date-fns';
import type { PeriodoContributivo } from '../tipos';

// Elimina sobreposições e soma os períodos contributivos em dias.
// CNIS frequentemente tem períodos duplicados (emprego + facultativo simultâneo).
export function somarPeriodosContributivos(periodos: PeriodoContributivo[], ate?: Date): number {
  if (periodos.length === 0) return 0;

  const limite = ate ?? new Date();

  // Converte para intervalos Date, ignorando períodos após o limite
  const intervalos = periodos
    .map((p) => ({
      inicio: parseISO(p.inicio),
      fim: dateMin([parseISO(p.fim), limite]),
    }))
    .filter((i) => isBefore(i.inicio, i.fim) || isEqual(i.inicio, i.fim))
    .sort((a, b) => a.inicio.getTime() - b.inicio.getTime());

  if (intervalos.length === 0) return 0;

  // Merge overlapping intervals
  const merged: Array<{ inicio: Date; fim: Date }> = [intervalos[0]];

  for (let i = 1; i < intervalos.length; i++) {
    const last = merged[merged.length - 1];
    const curr = intervalos[i];

    if (!isAfter(curr.inicio, last.fim)) {
      // Sobreposição: expandir o fim
      last.fim = dateMax([last.fim, curr.fim]);
    } else {
      merged.push(curr);
    }
  }

  return merged.reduce((total, iv) => total + differenceInDays(iv.fim, iv.inicio), 0);
}

// Retorna dias de contribuição acumulados em uma data específica
// projeta 1 mês de contribuição por mês após a DER
export function contribDiasEmData(
  totalDiasDer: number,
  der: Date,
  dataAlvo: Date,
): number {
  if (!isAfter(dataAlvo, der)) return totalDiasDer;
  const mesesApos = mesesEntre(der, dataAlvo);
  // Cada mês após a DER acrescenta ~30.4375 dias
  return totalDiasDer + mesesApos * 30.4375;
}

export function mesesEntre(inicio: Date, fim: Date): number {
  const anos = fim.getFullYear() - inicio.getFullYear();
  const meses = fim.getMonth() - inicio.getMonth();
  return anos * 12 + meses;
}

export function diasParaAnosEMeses(dias: number): { anos: number; meses: number; diasRestantes: number } {
  const anos = Math.floor(dias / 365.25);
  const diasAposAnos = dias - anos * 365.25;
  const meses = Math.floor(diasAposAnos / 30.4375);
  const diasRestantes = Math.floor(diasAposAnos - meses * 30.4375);
  return { anos, meses, diasRestantes };
}

export function formatarPeriodoContributivo(dias: number): string {
  const { anos, meses, diasRestantes } = diasParaAnosEMeses(dias);
  const partes: string[] = [];
  if (anos > 0) partes.push(`${anos} ano${anos !== 1 ? 's' : ''}`);
  if (meses > 0) partes.push(`${meses} ${meses !== 1 ? 'meses' : 'mês'}`);
  if (diasRestantes > 0 || partes.length === 0) partes.push(`${diasRestantes} dia${diasRestantes !== 1 ? 's' : ''}`);
  if (partes.length === 1) return partes[0];
  const ultimo = partes.pop();
  return `${partes.join(', ')} e ${ultimo}`;
}

// Itera mês a mês a partir da DER buscando quando uma condição é satisfeita.
// Projeção: contribuição cresce 1 mês a cada mês decorrido.
// Retorna a data de cumprimento ou null se ultrapassar maxAnos.
export function projetarDataCumprimento(
  der: Date,
  dataNascimento: Date,
  totalDiasDer: number,
  maxAnos: number,
  check: (contribDias: number, idadeDias: number, ano: number) => boolean,
): Date | null {
  let current = new Date(der);

  for (let m = 0; m <= maxAnos * 12; m++) {
    const idadeDias = differenceInDays(current, dataNascimento);
    const contribDias = contribDiasEmData(totalDiasDer, der, current);
    if (check(contribDias, idadeDias, current.getFullYear())) {
      return current;
    }
    current = addMonths(current, 1);
  }
  return null;
}

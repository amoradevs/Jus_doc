import feriadosJson from '@/config/feriados_nacionais.json';

type FeriadoFixo   = { mes_dia: string; nome: string };
type FeriadoMovel  = { data: string;    nome: string };
type RecessoConfig = { inicio_mes_dia: string; fim_mes_dia: string };

const feriados = feriadosJson as {
  feriados_fixos:  FeriadoFixo[];
  feriados_moveis: FeriadoMovel[];
  recesso_forense: RecessoConfig;
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}

// "yyyy-MM-dd" string from a Date (local timezone-safe)
function toIso(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// "MM-dd" from a Date
function toMesDia(d: Date): string {
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function esFeriado(d: Date): boolean {
  const mesDia = toMesDia(d);
  if (feriados.feriados_fixos.some((f) => f.mes_dia === mesDia)) return true;
  const iso = toIso(d);
  if (feriados.feriados_moveis.some((f) => f.data === iso)) return true;
  return false;
}

function esRecessoForense(d: Date): boolean {
  const mes = d.getMonth() + 1; // 1-12
  const dia = d.getDate();
  // recesso_forense: inicio = "12-20", fim = "01-20"
  if (mes === 12 && dia >= 20) return true;
  if (mes === 1 && dia <= 20) return true;
  return false;
}

function esDiaUtil(d: Date): boolean {
  const dow = d.getDay(); // 0=Dom, 6=Sab
  if (dow === 0 || dow === 6) return false;
  if (esFeriado(d)) return false;
  if (esRecessoForense(d)) return false;
  return true;
}

function addDay(d: Date): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + 1);
  return next;
}

/**
 * Calcula a data limite a partir de uma data de início e um número de dias.
 *
 * @param dataInicio - "yyyy-MM-dd"
 * @param dias       - número de dias do prazo
 * @param diasUteis  - se true, exclui sábados, domingos, feriados e recesso forense
 * @returns          - "yyyy-MM-dd" da data limite
 */
export function calcularDataLimite(dataInicio: string, dias: number, diasUteis: boolean): string {
  const [ano, mes, dia] = dataInicio.split('-').map(Number);
  let current = new Date(ano, mes - 1, dia); // local, sem UTC shift

  if (!diasUteis) {
    current.setDate(current.getDate() + dias);
    return toIso(current);
  }

  let contados = 0;
  while (contados < dias) {
    current = addDay(current);
    if (esDiaUtil(current)) contados++;
  }
  return toIso(current);
}

/**
 * Calcula quantos dias (corridos ou úteis) faltam até uma data limite.
 * Retorna valor negativo se a data já passou.
 *
 * @param dataLimite - "yyyy-MM-dd"
 * @param hoje       - "yyyy-MM-dd" (default: hoje)
 * @param diasUteis  - se true, conta apenas dias úteis
 */
export function diasRestantes(dataLimite: string, hoje?: string, diasUteis = false): number {
  const hojeStr = hoje ?? toIso(new Date());
  const [ah, mh, dh] = hojeStr.split('-').map(Number);
  const [al, ml, dl] = dataLimite.split('-').map(Number);

  const hojeDate  = new Date(ah, mh - 1, dh);
  const limiteDate = new Date(al, ml - 1, dl);

  if (!diasUteis) {
    const diffMs = limiteDate.getTime() - hojeDate.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  // Conta dias úteis entre hoje e data limite (funciona para datas passadas e futuras)
  if (toIso(hojeDate) === toIso(limiteDate)) return 0;

  const isPositive = limiteDate > hojeDate;
  const start = isPositive ? hojeDate : limiteDate;
  const end   = isPositive ? limiteDate : hojeDate;

  let count = 0;
  let cursor = new Date(start);
  while (toIso(cursor) !== toIso(end)) {
    cursor = addDay(cursor);
    if (esDiaUtil(cursor)) count++;
    if (count > 5000) break; // safety
  }

  return isPositive ? count : -count;
}

// Exporta helpers para uso nos testes
export { esFeriado, esRecessoForense, esDiaUtil };

import { describe, it, expect } from 'vitest';
import { calcularDataLimite, diasRestantes, esFeriado, esRecessoForense, esDiaUtil } from '../calcular-data-limite';

// ── Helpers de prazo corrido ──────────────────────────────────────────────────

describe('calcularDataLimite — prazo corrido', () => {
  it('adiciona exatamente 30 dias corridos', () => {
    // 2026-05-08 + 30 dias = 2026-06-07
    expect(calcularDataLimite('2026-05-08', 30, false)).toBe('2026-06-07');
  });

  it('cruza virada de mês corretamente', () => {
    // 2026-01-31 + 1 dia = 2026-02-01
    expect(calcularDataLimite('2026-01-31', 1, false)).toBe('2026-02-01');
  });

  it('cruza virada de ano corretamente', () => {
    // 2026-12-31 + 1 dia = 2027-01-01
    expect(calcularDataLimite('2026-12-31', 1, false)).toBe('2027-01-01');
  });

  it('0 dias retorna a mesma data de início', () => {
    expect(calcularDataLimite('2026-05-08', 0, false)).toBe('2026-05-08');
  });
});

// ── Feriados e fins de semana ─────────────────────────────────────────────────

describe('esFeriado', () => {
  it('01-01 é feriado fixo', () => {
    expect(esFeriado(new Date(2026, 0, 1))).toBe(true);
  });

  it('25-12 é feriado fixo', () => {
    expect(esFeriado(new Date(2026, 11, 25))).toBe(true);
  });

  it('2026-04-03 (Sexta-feira Santa) é feriado móvel', () => {
    expect(esFeriado(new Date(2026, 3, 3))).toBe(true);
  });

  it('2026-02-17 (Carnaval terça) é feriado móvel', () => {
    expect(esFeriado(new Date(2026, 1, 17))).toBe(true);
  });

  it('dia comum não é feriado', () => {
    expect(esFeriado(new Date(2026, 4, 8))).toBe(false); // 2026-05-08 (sexta)
  });
});

describe('esRecessoForense', () => {
  it('20 de dezembro é recesso', () => {
    expect(esRecessoForense(new Date(2026, 11, 20))).toBe(true);
  });

  it('31 de dezembro é recesso', () => {
    expect(esRecessoForense(new Date(2026, 11, 31))).toBe(true);
  });

  it('01 de janeiro é recesso', () => {
    expect(esRecessoForense(new Date(2027, 0, 1))).toBe(true);
  });

  it('20 de janeiro é recesso', () => {
    expect(esRecessoForense(new Date(2027, 0, 20))).toBe(true);
  });

  it('21 de janeiro NÃO é recesso', () => {
    expect(esRecessoForense(new Date(2027, 0, 21))).toBe(false);
  });

  it('19 de dezembro NÃO é recesso', () => {
    expect(esRecessoForense(new Date(2026, 11, 19))).toBe(false);
  });
});

describe('esDiaUtil', () => {
  it('sábado não é dia útil', () => {
    expect(esDiaUtil(new Date(2026, 4, 9))).toBe(false); // 2026-05-09 sáb
  });

  it('domingo não é dia útil', () => {
    expect(esDiaUtil(new Date(2026, 4, 10))).toBe(false); // 2026-05-10 dom
  });

  it('01-01 (feriado fixo, quinta) não é dia útil', () => {
    expect(esDiaUtil(new Date(2026, 0, 1))).toBe(false);
  });

  it('segunda-feira comum é dia útil', () => {
    expect(esDiaUtil(new Date(2026, 4, 11))).toBe(true); // 2026-05-11 seg
  });

  it('dia dentro do recesso forense não é dia útil', () => {
    expect(esDiaUtil(new Date(2026, 11, 25))).toBe(false); // Natal + recesso
    expect(esDiaUtil(new Date(2026, 11, 22))).toBe(false); // recesso (ter)
  });
});

// ── Prazo em dias úteis ───────────────────────────────────────────────────────

describe('calcularDataLimite — dias úteis', () => {
  it('15 dias úteis a partir de 2026-05-08 (sexta)', () => {
    // 2026-05-08 = sexta. Próximos 15 dias úteis:
    // Sem. 1: seg 11, ter 12, qua 13, qui 14, sex 15  → 5
    // Sem. 2: seg 18, ter 19, qua 20, qui 21, sex 22  → 10
    // Sem. 3: seg 25, ter 26, qua 27, qui 28, sex 29  → 15
    expect(calcularDataLimite('2026-05-08', 15, true)).toBe('2026-05-29');
  });

  it('5 dias úteis a partir de 2026-05-08', () => {
    // seg 11, ter 12, qua 13, qui 14, sex 15
    expect(calcularDataLimite('2026-05-08', 5, true)).toBe('2026-05-15');
  });

  it('cruza feriado nacional (01-05 = sexta)', () => {
    // 2026-04-28 (ter) + 5 dias úteis, pulando 01-05 (sex = Dia do Trabalho)
    // qua 29 → 1, qui 30 → 2, sex 01-05 SKIP, seg 04 → 3, ter 05 → 4, qua 06 → 5
    expect(calcularDataLimite('2026-04-28', 5, true)).toBe('2026-05-06');
  });

  it('cruza recesso forense', () => {
    // 2026-12-18 (sex) + 5 dias úteis
    // O recesso começa em 20-12. Dias úteis disponíveis: seg 21-12 NÃO (recesso),
    // todo o período até 20-01-2027 é recesso.
    // 1° dia útil após o recesso: 2027-01-21 (qui)
    // → 5 dias: qui 21, sex 22, seg 25, ter 26, qua 27 = 2027-01-27
    expect(calcularDataLimite('2026-12-18', 5, true)).toBe('2027-01-27');
  });

  it('cruza Carnaval 2026', () => {
    // 2026-02-12 (qui) + 3 dias úteis, pulando carnaval seg 16 e ter 17
    // sex 13, depois: seg 16 (carnaval SKIP), ter 17 (carnaval SKIP), qua 18 → 2
    // qui 19 → 3
    expect(calcularDataLimite('2026-02-12', 3, true)).toBe('2026-02-19');
  });
});

// ── diasRestantes ─────────────────────────────────────────────────────────────

describe('diasRestantes', () => {
  it('retorna positivo quando a data limite é futura', () => {
    const hoje = '2026-05-01';
    const limite = '2026-05-31';
    expect(diasRestantes(limite, hoje, false)).toBe(30);
  });

  it('retorna 0 quando hoje é o dia do prazo', () => {
    expect(diasRestantes('2026-05-08', '2026-05-08', false)).toBe(0);
  });

  it('retorna negativo quando o prazo já passou', () => {
    expect(diasRestantes('2026-05-01', '2026-05-08', false)).toBe(-7);
  });
});

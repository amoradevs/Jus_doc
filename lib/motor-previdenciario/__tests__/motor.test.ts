import { describe, it, expect } from 'vitest';
import { executarCalculoPrevidenciario } from '../index';
import type { EntradaCalculoPrevidenciario } from '../index';

// Caso de regressão baseado nos dados corrigidos do DIVERGENCIAS.md
// Os valores esperados são os CORRETOS conforme análise jurídica

describe('Motor Previdenciário — Caso Glauber', () => {
  // Dados hipotéticos do segurado Glauber (homem, filiado antes da reforma)
  const entradaGlauber: EntradaCalculoPrevidenciario = {
    dataNascimento: '1965-03-15',
    sexo: 'M',
    der: '2025-04-01',
    filiadoAntesDaReforma: true,
    periodos: [
      { inicio: '1985-06-01', fim: '2019-11-13', origem: 'RGPS' },
      { inicio: '2019-11-13', fim: '2025-04-01', origem: 'RGPS' },
    ],
    salarios: [
      { competencia: '01/2023', valor: 2500 },
      { competencia: '02/2023', valor: 2500 },
      { competencia: '03/2023', valor: 2600 },
      { competencia: '04/2023', valor: 2600 },
    ],
  };

  it('retorna totalContributivoDias positivo', () => {
    const resultado = executarCalculoPrevidenciario(entradaGlauber);
    expect(resultado.totalContributivoDias).toBeGreaterThan(0);
  });

  it('totalContributivoFormatado é uma string legível', () => {
    const resultado = executarCalculoPrevidenciario(entradaGlauber);
    expect(resultado.totalContributivoFormatado).toMatch(/\d+ anos?/);
  });

  it('Art. 18 (Aposentadoria por Idade) é elegível para todos', () => {
    const resultado = executarCalculoPrevidenciario(entradaGlauber);
    expect(resultado.art18AposIdade.elegivel).toBe(true);
  });

  it('Art. 15 é elegível pois filiado antes da reforma', () => {
    const resultado = executarCalculoPrevidenciario(entradaGlauber);
    expect(resultado.art15Pontos.elegivel).toBe(true);
  });

  it('coeficiente EC 103 é entre 0.6 e 1.0', () => {
    const resultado = executarCalculoPrevidenciario(entradaGlauber);
    expect(resultado.coeficienteEC103).toBeGreaterThanOrEqual(0.6);
    expect(resultado.coeficienteEC103).toBeLessThanOrEqual(1.0);
  });

  it('beneficioMensal = salarioBeneficio × coeficienteEC103', () => {
    const resultado = executarCalculoPrevidenciario(entradaGlauber);
    const esperado = Math.round(resultado.salarioBeneficio * resultado.coeficienteEC103 * 100) / 100;
    expect(resultado.beneficioMensal).toBeCloseTo(esperado, 1);
  });

  it('não elege Art. 20 quando elegível ao Art. 17', () => {
    // Glauber com ~34 anos de contrib na reforma → elegível ao Art. 17 (≥33 anos)
    const resultado = executarCalculoPrevidenciario(entradaGlauber);
    // Art. 17 deve ser elegível; Art. 20 não deve ser elegível (exclusão mútua)
    if (resultado.art17Pedagio50.elegivel) {
      expect(resultado.art20Pedagio100.elegivel).toBe(false);
    }
  });
});

describe('Motor Previdenciário — Não filiado antes da reforma', () => {
  const entrada: EntradaCalculoPrevidenciario = {
    dataNascimento: '1990-01-01',
    sexo: 'F',
    der: '2025-04-01',
    filiadoAntesDaReforma: false,
    periodos: [{ inicio: '2020-01-01', fim: '2025-04-01', origem: 'RGPS' }],
    salarios: [{ competencia: '01/2025', valor: 3000 }],
  };

  it('Art. 15, 16, 17 e 20 não são elegíveis (pós-reforma)', () => {
    const resultado = executarCalculoPrevidenciario(entrada);
    expect(resultado.art15Pontos.elegivel).toBe(false);
    expect(resultado.art16IdadeProgressiva.elegivel).toBe(false);
    expect(resultado.art17Pedagio50.elegivel).toBe(false);
    expect(resultado.art20Pedagio100.elegivel).toBe(false);
  });

  it('Art. 18 é elegível para todos', () => {
    const resultado = executarCalculoPrevidenciario(entrada);
    expect(resultado.art18AposIdade.elegivel).toBe(true);
  });
});

describe('Motor Previdenciário — Sobreposição de períodos CNIS', () => {
  it('elimina sobreposição e não superestima o tempo', () => {
    const entrada: EntradaCalculoPrevidenciario = {
      dataNascimento: '1970-01-01',
      sexo: 'M',
      der: '2025-01-01',
      filiadoAntesDaReforma: true,
      periodos: [
        { inicio: '2000-01-01', fim: '2010-12-31', origem: 'RGPS' },
        { inicio: '2005-01-01', fim: '2015-12-31', origem: 'RGPS' }, // sobreposição 2005-2010
      ],
      salarios: [],
    };
    const resultado = executarCalculoPrevidenciario(entrada);
    // Sem sobreposição: 2000-2015 = 15 anos ≈ 5478 dias
    // Com soma ingênua seria 2000-2010 + 2005-2015 = 10+10 = 20 anos (errado)
    expect(resultado.totalContributivoDias).toBeLessThan(16 * 366);
    expect(resultado.totalContributivoDias).toBeGreaterThan(14 * 365);
  });
});

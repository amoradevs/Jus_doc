import { describe, it, expect } from 'vitest';
import { montarPacote, validarCoerencia } from '../cadeia-documental';
import type { Cenario } from '../cadeia-documental';

// ─── Spec 7 — 7 casos canônicos ──────────────────────────────────────────────

describe('montarPacote — spec 7', () => {

  // 7.1: BPC adulto simples
  it('7.1 BPC + adulto_capaz → 4 docs, 0 alertas de erro', () => {
    const cenario: Cenario = { beneficio: 'bpc', perfil: 'adulto_capaz', gatilhos: [] };
    const { codigos, alertas, fonte } = montarPacote(cenario);

    expect(codigos).toEqual(['01', '02', '05', '03']);
    expect(codigos).toHaveLength(4);
    expect(alertas.filter((a) => a.nivel === 'erro')).toHaveLength(0);

    expect(fonte['01']).toBe('cadeia_minima');
    expect(fonte['02']).toBe('cadeia_minima');
    expect(fonte['03']).toBe('cadeia_minima');
    expect(fonte['05']).toBe('cadeia_minima');
  });

  // 7.2: BPC + todos os gatilhos → 6 docs, aviso MEI (template 07 ausente)
  it('7.2 BPC + adulto_capaz + todos gatilhos → 6 docs, aviso MEI_TEMPLATE_AUSENTE', () => {
    const cenario: Cenario = {
      beneficio: 'bpc',
      perfil: 'adulto_capaz',
      gatilhos: ['imovel_terceiro', 'mei_inativo', 'separado_de_fato'],
    };
    const { codigos, alertas, fonte } = montarPacote(cenario);

    // 4 cadeia mínima + 04 (imovel) + 06 (separado) — sem 07 (mei_inativo não tem template)
    expect(codigos).toEqual(['01', '02', '05', '03', '04', '06']);
    expect(codigos).not.toContain('07');

    expect(fonte['04']).toBe('modular');
    expect(fonte['06']).toBe('modular');
    expect(fonte['01']).toBe('cadeia_minima');

    const mei = alertas.find((a) => a.codigo === 'MEI_TEMPLATE_AUSENTE');
    expect(mei).toBeDefined();
    expect(mei!.nivel).toBe('aviso');
  });

  // 7.3: BPC + menor_impubere → 4 docs + info TERMO_RESPONSABILIDADE_AUSENTE
  it('7.3 BPC + menor_impubere → 4 docs, info TERMO_RESPONSABILIDADE_AUSENTE', () => {
    const cenario: Cenario = { beneficio: 'bpc', perfil: 'menor_impubere', gatilhos: [] };
    const { codigos, alertas } = montarPacote(cenario);

    expect(codigos).toHaveLength(4);
    const termo = alertas.find((a) => a.codigo === 'TERMO_RESPONSABILIDADE_AUSENTE');
    expect(termo).toBeDefined();
    expect(termo!.nivel).toBe('info');
    expect(alertas.filter((a) => a.nivel === 'erro')).toHaveLength(0);
  });

  // 7.4: BPC + a_rogo → 4 docs + aviso AROGO_CONFIRMAR_TESTEMUNHAS
  it('7.4 BPC + a_rogo → 4 docs, aviso AROGO_CONFIRMAR_TESTEMUNHAS', () => {
    const cenario: Cenario = { beneficio: 'bpc', perfil: 'a_rogo', gatilhos: [] };
    const { codigos, alertas } = montarPacote(cenario);

    expect(codigos).toHaveLength(4);
    const arogo = alertas.find((a) => a.codigo === 'AROGO_CONFIRMAR_TESTEMUNHAS');
    expect(arogo).toBeDefined();
    expect(arogo!.nivel).toBe('aviso');
  });

  // 7.5: Aposentadoria + imovel_terceiro → 4 docs, sem código '03'
  it('7.5 aposentadoria_idade + imovel_terceiro → 4 docs, sem código 03', () => {
    const cenario: Cenario = {
      beneficio: 'aposentadoria_idade',
      perfil: 'adulto_capaz',
      gatilhos: ['imovel_terceiro'],
    };
    const { codigos, fonte } = montarPacote(cenario);

    // 01, 02, 05 (cadeia) + 04 (modular imovel) — sem 03 (hipossuficiência é só BPC)
    expect(codigos).toEqual(['01', '02', '05', '04']);
    expect(codigos).not.toContain('03');

    expect(fonte['04']).toBe('modular');
    expect(fonte['05']).toBe('cadeia_minima');
  });

  // 7.6: MS adulto → 2 docs, sem '05', info MS_GRATUIDADE_JUSTICA + PACOTE_PEQUENO
  it('7.6 mandado_seguranca + adulto_capaz → 2 docs, sem 05 e 03, info MS_GRATUIDADE_JUSTICA', () => {
    const cenario: Cenario = { beneficio: 'mandado_seguranca', perfil: 'adulto_capaz', gatilhos: [] };
    const { codigos, alertas } = montarPacote(cenario);

    // MS: só 01 e 02 (05 é apenas BPC/apos, 03 é só BPC)
    expect(codigos).toHaveLength(2);
    expect(codigos).toContain('01');
    expect(codigos).toContain('02');
    expect(codigos).not.toContain('05');
    expect(codigos).not.toContain('03');

    const ms = alertas.find((a) => a.codigo === 'MS_GRATUIDADE_JUSTICA');
    expect(ms).toBeDefined();
    expect(ms!.nivel).toBe('info');

    const pequeno = alertas.find((a) => a.codigo === 'PACOTE_PEQUENO');
    expect(pequeno).toBeDefined();
    expect(pequeno!.nivel).toBe('info');
  });

  // 7.7: MS + separado_de_fato → 2 docs, aviso SEPARADO_FATO_FORA_BPC (declaração omitida)
  it('7.7 mandado_seguranca + separado_de_fato → 2 docs, aviso SEPARADO_FATO_FORA_BPC', () => {
    const cenario: Cenario = {
      beneficio: 'mandado_seguranca',
      perfil: 'adulto_capaz',
      gatilhos: ['separado_de_fato'],
    };
    const { codigos, alertas, fonte } = montarPacote(cenario);

    // Declaração 06 é só BPC — mesmo com gatilho ativo, não inclui para MS
    expect(codigos).toEqual(['01', '02']);
    expect(codigos).not.toContain('06');

    // Tudo é cadeia mínima — nenhum modular foi incluído
    expect(fonte['01']).toBe('cadeia_minima');
    expect(fonte['02']).toBe('cadeia_minima');

    const aviso = alertas.find((a) => a.codigo === 'SEPARADO_FATO_FORA_BPC');
    expect(aviso).toBeDefined();
    expect(aviso!.nivel).toBe('aviso');
  });

  // Spec 4.1: MS não inclui Termo de Representação INSS (via judicial direta)
  it('Spec 4.1 — mandado_seguranca não inclui template 05 (Termo INSS)', () => {
    const cenario: Cenario = { beneficio: 'mandado_seguranca', perfil: 'adulto_capaz', gatilhos: [] };
    const { codigos } = montarPacote(cenario);
    expect(codigos).not.toContain('05');
    expect(codigos).toEqual(['01', '02']);
  });
});

// ─── Extra — validações adicionais ───────────────────────────────────────────

describe('validarCoerencia — validações extras', () => {

  // Extra 1: campo_relacionado correto para separado_de_fato fora BPC
  it('Extra 1 — SEPARADO_FATO_FORA_BPC tem campo_relacionado correto', () => {
    const cenario: Cenario = {
      beneficio: 'aposentadoria_idade',
      perfil: 'adulto_capaz',
      gatilhos: ['separado_de_fato'],
    };
    const alertas = validarCoerencia(cenario);
    const alerta = alertas.find((a) => a.codigo === 'SEPARADO_FATO_FORA_BPC');
    expect(alerta?.campo_relacionado).toBe('gatilhos[separado_de_fato]');
  });

  // Extra 2: campo_relacionado correto para a_rogo
  it('Extra 2 — AROGO_CONFIRMAR_TESTEMUNHAS tem campo_relacionado="perfil"', () => {
    const cenario: Cenario = { beneficio: 'bpc', perfil: 'a_rogo', gatilhos: [] };
    const alertas = validarCoerencia(cenario);
    const alerta = alertas.find((a) => a.codigo === 'AROGO_CONFIRMAR_TESTEMUNHAS');
    expect(alerta?.campo_relacionado).toBe('perfil');
  });

  // Extra 3: separado_de_fato fora BPC gera aviso para aposentadoria_idade também
  it('Extra 3 — separado_de_fato + aposentadoria_idade também gera SEPARADO_FATO_FORA_BPC', () => {
    const cenario: Cenario = {
      beneficio: 'aposentadoria_idade',
      perfil: 'adulto_capaz',
      gatilhos: ['separado_de_fato'],
    };
    const alertas = validarCoerencia(cenario);
    const aviso = alertas.find((a) => a.codigo === 'SEPARADO_FATO_FORA_BPC');
    expect(aviso).toBeDefined();
    // BPC com separado_de_fato NÃO gera o aviso
    const cenarioBpc: Cenario = { beneficio: 'bpc', perfil: 'adulto_capaz', gatilhos: ['separado_de_fato'] };
    const alertasBpc = validarCoerencia(cenarioBpc);
    expect(alertasBpc.find((a) => a.codigo === 'SEPARADO_FATO_FORA_BPC')).toBeUndefined();
  });
});

// ─── Ordem canônica dos códigos ───────────────────────────────────────────────

describe('montarPacote — ordem canônica', () => {
  it('BPC com todos os gatilhos válidos mantém ordem por campo "ordem"', () => {
    const cenario: Cenario = {
      beneficio: 'bpc',
      perfil: 'adulto_capaz',
      gatilhos: ['imovel_terceiro', 'separado_de_fato'],
    };
    const { codigos } = montarPacote(cenario);
    // Ordem: 01(1), 02(2), 05(3), 03(4), 04(5), 06(7)
    expect(codigos).toEqual(['01', '02', '05', '03', '04', '06']);
  });
});

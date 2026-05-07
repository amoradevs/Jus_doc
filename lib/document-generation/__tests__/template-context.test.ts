import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/db', () => ({ db: {} }));

import { getCenarioContextOverrides } from '../template-context';
import type { Cenario } from '../cadeia-documental';

// ─── getCenarioContextOverrides — 4 cenários canônicos ───────────────────────

describe('getCenarioContextOverrides', () => {

  // Cenário 1: BPC + adulto capaz
  it('BPC + adulto_capaz → blocos de adulto, honorarios padrão, paragrafos_recurso=true', () => {
    const cenario: Cenario = { beneficio: 'bpc', perfil: 'adulto_capaz', gatilhos: [] };
    const ctx = getCenarioContextOverrides(cenario);

    expect(ctx.bloco_contratante_maior_capaz).toBe(true);
    expect(ctx.bloco_contratante_a_rogo).toBe(false);
    expect(ctx.bloco_contratante_menor).toBe(false);

    expect(ctx.bloco_assinatura_adulto).toBe(true);
    expect(ctx.bloco_assinatura_a_rogo).toBe(false);
    expect(ctx.bloco_assinatura_menor).toBe(false);

    expect(ctx.bloco_honorarios_padrao).toBe(true);
    expect(ctx.bloco_honorarios_menor).toBe(false);
    expect(ctx.bloco_honorarios_mandado_seguranca).toBe(false);

    expect(ctx.bloco_paragrafos_recurso).toBe(true);

    expect(ctx.processo?.tipo_beneficio_descricao).toContain('PRESTAÇÃO CONTINUADA');
    expect(ctx.processo?.objeto_procuracao).toContain('INSS');
  });

  // Cenário 2: BPC + menor impúbere
  it('BPC + menor_impubere → blocos de menor, honorarios_menor, paragrafos_recurso=true', () => {
    const cenario: Cenario = { beneficio: 'bpc', perfil: 'menor_impubere', gatilhos: [] };
    const ctx = getCenarioContextOverrides(cenario);

    expect(ctx.bloco_contratante_menor).toBe(true);
    expect(ctx.bloco_contratante_maior_capaz).toBe(false);
    expect(ctx.bloco_contratante_a_rogo).toBe(false);

    expect(ctx.bloco_assinatura_menor).toBe(true);
    expect(ctx.bloco_assinatura_adulto).toBe(false);
    expect(ctx.bloco_assinatura_a_rogo).toBe(false);

    expect(ctx.bloco_honorarios_menor).toBe(true);
    expect(ctx.bloco_honorarios_padrao).toBe(false);
    expect(ctx.bloco_honorarios_mandado_seguranca).toBe(false);

    expect(ctx.bloco_paragrafos_recurso).toBe(true);
  });

  // Cenário 3: BPC + a_rogo
  it('BPC + a_rogo → blocos de a_rogo, honorarios padrão, paragrafos_recurso=true', () => {
    const cenario: Cenario = { beneficio: 'bpc', perfil: 'a_rogo', gatilhos: [] };
    const ctx = getCenarioContextOverrides(cenario);

    expect(ctx.bloco_contratante_a_rogo).toBe(true);
    expect(ctx.bloco_contratante_maior_capaz).toBe(false);
    expect(ctx.bloco_contratante_menor).toBe(false);

    expect(ctx.bloco_assinatura_a_rogo).toBe(true);
    expect(ctx.bloco_assinatura_adulto).toBe(false);
    expect(ctx.bloco_assinatura_menor).toBe(false);

    expect(ctx.bloco_honorarios_padrao).toBe(true);
    expect(ctx.bloco_honorarios_menor).toBe(false);
    expect(ctx.bloco_honorarios_mandado_seguranca).toBe(false);

    expect(ctx.bloco_paragrafos_recurso).toBe(true);
  });

  // Cenário 4: MS + adulto capaz
  it('mandado_seguranca + adulto_capaz → honorarios_MS, paragrafos_recurso=false, objeto MS', () => {
    const cenario: Cenario = { beneficio: 'mandado_seguranca', perfil: 'adulto_capaz', gatilhos: [] };
    const ctx = getCenarioContextOverrides(cenario);

    expect(ctx.bloco_contratante_maior_capaz).toBe(true);
    expect(ctx.bloco_assinatura_adulto).toBe(true);

    expect(ctx.bloco_honorarios_mandado_seguranca).toBe(true);
    expect(ctx.bloco_honorarios_padrao).toBe(false);
    expect(ctx.bloco_honorarios_menor).toBe(false);

    expect(ctx.bloco_paragrafos_recurso).toBe(false);

    expect(ctx.processo?.tipo_beneficio_descricao).toContain('MANDADO DE SEGURANÇA');
    expect(ctx.processo?.objeto_procuracao).toContain('MANDADO DE SEGURANÇA');
  });

  // Invariante: exatamente um bloco de cada grupo ativo
  it('invariante — exatamente um bloco de honorários ativo por cenário', () => {
    const cenarios: Cenario[] = [
      { beneficio: 'bpc', perfil: 'adulto_capaz', gatilhos: [] },
      { beneficio: 'bpc', perfil: 'menor_impubere', gatilhos: [] },
      { beneficio: 'mandado_seguranca', perfil: 'adulto_capaz', gatilhos: [] },
      { beneficio: 'aposentadoria_idade', perfil: 'a_rogo', gatilhos: [] },
    ];

    for (const cenario of cenarios) {
      const ctx = getCenarioContextOverrides(cenario);
      const ativos = [
        ctx.bloco_honorarios_padrao,
        ctx.bloco_honorarios_menor,
        ctx.bloco_honorarios_mandado_seguranca,
      ].filter(Boolean).length;
      expect(ativos).toBe(1);
    }
  });

  it('invariante — exatamente um bloco de assinatura ativo por cenário', () => {
    const cenarios: Cenario[] = [
      { beneficio: 'bpc', perfil: 'adulto_capaz', gatilhos: [] },
      { beneficio: 'bpc', perfil: 'a_rogo', gatilhos: [] },
      { beneficio: 'bpc', perfil: 'menor_pubere', gatilhos: [] },
      { beneficio: 'bpc', perfil: 'incapaz_curador', gatilhos: [] },
    ];

    for (const cenario of cenarios) {
      const ctx = getCenarioContextOverrides(cenario);
      const ativos = [
        ctx.bloco_assinatura_adulto,
        ctx.bloco_assinatura_a_rogo,
        ctx.bloco_assinatura_menor,
      ].filter(Boolean).length;
      expect(ativos).toBe(1);
    }
  });
});

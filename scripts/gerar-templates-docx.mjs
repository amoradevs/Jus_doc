/**
 * Gera os templates DOCX de produção + variantes renderizadas para validação.
 * Execute: node scripts/gerar-templates-docx.mjs
 * Saída: scripts/output/
 */

import {
  Document, Packer, Paragraph, TextRun,
  AlignmentType, Table, TableRow, TableCell,
  WidthType, BorderStyle, TableLayoutType,
} from 'docx';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const angularExpressions = require('angular-expressions');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, 'output');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ─── Parser docxtemplater ─────────────────────────────────────────────────────

function angularParser(tag) {
  if (tag === '.') return { get: (s) => s };
  const expr = angularExpressions.compile(tag.replace(/('|')/g, "'").replace(/(")/g, '"'));
  return {
    get(scope, context) {
      let obj = {};
      for (let i = 0, len = context.num + 1; i < len; i++) obj = Object.assign(obj, context.scopeList[i]);
      return expr(scope, obj);
    },
  };
}

// ─── Constantes de layout ─────────────────────────────────────────────────────

// Margens: 1134 twips (~2cm) cada lado
// Largura do conteúdo A4: 11906 - 1134 - 1134 = 9638 twips
const COL_W  = 4519; // 47% de 9638
const GAP_W  = 600;  // ~6% de espaçamento entre colunas
// Total: 4519 + 600 + 4519 = 9638 twips ✓

const LINHA_COL   = '_'.repeat(24); // 24 chars — padrão dos originais, cabe em COL_W
const LINHA_PLENA = '_'.repeat(38); // para assinatura em largura total

// ─── Helpers de parágrafo ─────────────────────────────────────────────────────

const t  = (s) => new TextRun({ text: s, size: 24 });
const v  = (s) => new TextRun({ text: s, size: 24 }); // variável docxtemplater (texto literal)
const b  = (s) => new TextRun({ text: s, bold: true, size: 24 });

function pj(...runs) { // parágrafo justificado
  return new Paragraph({
    children: runs.map(r => typeof r === 'string' ? t(r) : r),
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 160 },
  });
}

function pc(...runs) { // parágrafo centrado
  return new Paragraph({
    children: runs.map(r => typeof r === 'string' ? t(r) : r),
    alignment: AlignmentType.CENTER,
    spacing: { after: 160 },
  });
}

function pl(text, opts = {}) { // parágrafo left-aligned (para assinaturas)
  return new Paragraph({
    children: [t(text)],
    alignment: AlignmentType.LEFT,
    spacing: { after: 40, ...opts },
  });
}

function plr(...runs) { // parágrafo left-aligned com runs
  return new Paragraph({
    children: runs.map(r => typeof r === 'string' ? t(r) : r),
    alignment: AlignmentType.LEFT,
    spacing: { after: 40 },
  });
}

function esp(after = 200) {
  return new Paragraph({ text: '', spacing: { after } });
}

function titulo(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 28, allCaps: true })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
  });
}

function blocoTag(tag) { // tag docxtemplater em parágrafo próprio
  return new Paragraph({
    children: [t(tag)],
    alignment: AlignmentType.LEFT,
    spacing: { before: 0, after: 0 },
  });
}

// ─── Helper de tabela 2 colunas sem bordas visíveis ──────────────────────────
// BorderStyle.NIL + color FFFFFF: explicitamente sem borda E cor branca —
// invisível mesmo que Word renderize pelo estilo padrão.
// WidthType.PERCENTAGE: Word distribui espaço corretamente sem fixar twips.
// Retorna Table — usar com ch.push(sig2col(...))

const NO_BORDER = { style: BorderStyle.NIL, size: 0, color: 'FFFFFF' };
const CELL_BORDERS = {
  top: NO_BORDER, bottom: NO_BORDER,
  left: NO_BORDER, right: NO_BORDER,
};

// Largura do conteúdo A4 com margens 2cm: 11906 - 1134 - 1134 = 9638 twips
// Cada célula = 9638 / 2 = 4819 twips (DXA evita o bug "50%" do docx lib)
const CELL_DXA = 4819;
const TABLE_DXA = 9638;

function sig2col(esqLinhas, dirLinhas, spAfter = 80) {
  const makeCell = (linhas) => new TableCell({
    width: { size: CELL_DXA, type: WidthType.DXA },
    borders: CELL_BORDERS,
    children: linhas.map(l => typeof l === 'string'
      ? new Paragraph({ children: [t(l)], alignment: AlignmentType.LEFT, spacing: { after: spAfter } })
      : l),
  });
  return new Table({
    width: { size: TABLE_DXA, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    rows: [new TableRow({
      children: [makeCell(esqLinhas), makeCell(dirLinhas)],
    })],
  });
}

// ─── Bloco condicional de assinatura das contratadas ─────────────────────────
// Insere {#tem_duas_advogadas} → tabela 2 colunas; {^} → linha única larga.

function sigContratadas(ch) {
  ch.push(blocoTag('{#tem_duas_advogadas}'));
  ch.push(sig2col(
    [LINHA_COL, '{escritorio.adv1_nome}', 'Contratada'],
    [LINHA_COL, '{escritorio.adv2_nome}', 'Contratada'],
  ));
  ch.push(blocoTag('{/tem_duas_advogadas}'));
  ch.push(blocoTag('{^tem_duas_advogadas}'));
  ch.push(blocoTag('{#mostrar_lidiane}'));
  ch.push(pl(LINHA_PLENA));
  ch.push(plr(v('{escritorio.adv1_nome}')));
  ch.push(pl('Contratada'));
  ch.push(blocoTag('{/mostrar_lidiane}'));
  ch.push(blocoTag('{#mostrar_alcione}'));
  ch.push(pl(LINHA_PLENA));
  ch.push(plr(v('{escritorio.adv2_nome}')));
  ch.push(pl('Contratada'));
  ch.push(blocoTag('{/mostrar_alcione}'));
  ch.push(blocoTag('{/tem_duas_advogadas}'));
}

// ─── Contextos mock ───────────────────────────────────────────────────────────

const ESCRITORIO = {
  adv1_nome: 'ALCIONE FERREIRA GOMES ALENCAR',
  adv1_oab: '218.550-SP',
  adv1_email: 'alcionealencar@outlook.com',
  adv2_nome: 'LIDIANE ROCHA ABREU',
  adv2_oab: '220305',
  adv2_cpf: '123.456.789-00',
  adv2_email: 'lidianer.abreu@gmail.com',
  endereco_logradouro: 'Rua Irmã Pia',
  endereco_numero: '172',
  endereco_complemento: 'Sala 13',
  endereco_bairro: 'Jaguaré',
  endereco_cidade: 'São Paulo',
  endereco_uf: 'SP',
  endereco_cep: '05335-050',
  foro_eleito: 'Regional de Pinheiros, Comarca da Capital (SP)',
};

const DOC = {
  cidade_assinatura: 'São Paulo (SP)',
  dia_assinatura: '07',
  mes_assinatura_extenso: 'maio',
  mes_assinatura_numero: '05',
  ano_assinatura: '2026',
};

const HONORARIOS_PADRAO = {
  qtd_salarios: 3,
  qtd_salarios_extenso: 'três',
  percentual_padrao: 30,
  percentual_padrao_extenso: 'trinta por cento',
  percentual_recurso: 40,
  percentual_recurso_extenso: 'quarenta por cento',
  valor_fixo: '',
  valor_fixo_extenso: '',
};

const MULTA = { qtd_salarios_minimos: 3, qtd_salarios_minimos_extenso: 'três' };

const TESTEMUNHAS = [
  { nome_completo: 'Roberto Lopes de Abreu Júnior', cpf: '010.337.257-14', rg: '371.511.80-X', data_nascimento: '28/02/1971' },
  { nome_completo: 'Adilson Lisboa Mendes',         cpf: '142.821.228-03', rg: '20.283.182',   data_nascimento: '04/11/1970' },
];

const CTX_ADULTO_BPC = {
  bloco_contratante_maior_capaz:       true,
  bloco_contratante_a_rogo:            false,
  bloco_contratante_menor:             false,
  bloco_honorarios_padrao:             true,
  bloco_honorarios_menor:              false,
  bloco_honorarios_mandado_seguranca:  false,
  bloco_assinatura_adulto:             true,
  bloco_assinatura_a_rogo:             false,
  bloco_assinatura_menor:              false,
  tem_duas_advogadas: true,
  mostrar_lidiane:    true,
  mostrar_alcione:    true,
  apenas_lidiane:     false,
  apenas_alcione:     false,
  cliente: {
    nome_completo: 'MARIA SILVA SANTOS',
    nacionalidade: 'brasileiro(a)',
    estado_civil: 'divorciado(a)',
    cpf: '012.345.678-90',
    rg: '12.345.678-9',
    rg_orgao_emissor: 'SSP/SP',
    data_nascimento: '18/07/1959',
    nome_mae: 'Joana Silva',
    condicao_menor: '',
  },
  endereco: {
    logradouro: 'Rua das Flores',
    numero: '171',
    complemento_formatado: ', Apto 12',
    bairro: 'Jaguaré',
    cidade: 'São Paulo',
    uf: 'SP',
    cep: '05330-030',
  },
  representante: { nome_completo: '', cpf: '', rg: '', parentesco: '' },
  testemunhas: TESTEMUNHAS,
  processo: {
    tipo_beneficio_descricao: 'obtenção do BENEFÍCIO DE PRESTAÇÃO CONTINUADA – BPC/LOAS',
    objeto_procuracao: 'ingressar com Pedido de BENEFÍCIO DE PRESTAÇÃO CONTINUADA EM FACE DA PREVIDÊNCIA SOCIAL (Instituto Nacional do Seguro Social – INSS)',
  },
  honorarios: HONORARIOS_PADRAO,
  multa: MULTA,
  escritorio: ESCRITORIO,
  doc: DOC,
};

const CTX_MENOR_BPC = {
  ...CTX_ADULTO_BPC,
  bloco_contratante_maior_capaz: false,
  bloco_contratante_menor:       true,
  bloco_honorarios_padrao:       false,
  bloco_honorarios_menor:        true,
  bloco_assinatura_adulto:       false,
  bloco_assinatura_menor:        true,
  cliente: {
    ...CTX_ADULTO_BPC.cliente,
    nome_completo: 'PEDRO SANTOS LIMA',
    data_nascimento: '10/03/2012',
    estado_civil: 'solteiro(a)',
    condicao_menor: 'impúbere',
  },
  representante: {
    nome_completo: 'ANA LIMA DOS SANTOS',
    cpf: '234.567.890-12',
    rg: '34.567.890-1',
    parentesco: 'mãe',
  },
};

const CTX_AROGO_BPC = {
  ...CTX_ADULTO_BPC,
  bloco_contratante_maior_capaz: false,
  bloco_contratante_a_rogo:      true,
  bloco_assinatura_adulto:       false,
  bloco_assinatura_a_rogo:       true,
};

const CTX_ADULTO_MS = {
  ...CTX_ADULTO_BPC,
  bloco_honorarios_padrao:            false,
  bloco_honorarios_mandado_seguranca: true,
  processo: {
    tipo_beneficio_descricao: 'impetração de MANDADO DE SEGURANÇA contra ato do INSS',
    objeto_procuracao: 'impetrar MANDADO DE SEGURANÇA em face do INSS (Instituto Nacional do Seguro Social)',
  },
  honorarios: {
    ...HONORARIOS_PADRAO,
    valor_fixo: '3.000,00',
    valor_fixo_extenso: 'três mil reais',
  },
};

// ─── Qualificação do contratante (bloco A — 3 variantes) ─────────────────────

function qualificacaoContratante(ch) {
  // Adulto capaz
  ch.push(blocoTag('{#bloco_contratante_maior_capaz}'));
  ch.push(pj(
    v('{cliente.nome_completo}'), t(', '),
    v('{cliente.nacionalidade}'), t(', '),
    v('{cliente.estado_civil}'), t(', inscrito(a) no CPF sob nº '),
    v('{cliente.cpf}'), t(', RG '), v('{cliente.rg}'), t(' '), v('{cliente.rg_orgao_emissor}'),
    t(', nascido(a) em '), v('{cliente.data_nascimento}'),
    t(', filho(a) de '), v('{cliente.nome_mae}'),
    t(', residente na '), v('{endereco.logradouro}'), t(', Nº '), v('{endereco.numero}'),
    v('{endereco.complemento_formatado}'), t(', Bairro: '), v('{endereco.bairro}'),
    t(', '), v('{endereco.cidade}'), t(' ('), v('{endereco.uf}'), t('), CEP.: '), v('{endereco.cep}'), t(';'),
  ));
  ch.push(blocoTag('{/bloco_contratante_maior_capaz}'));

  // A rogo
  ch.push(blocoTag('{#bloco_contratante_a_rogo}'));
  ch.push(pj(
    v('{cliente.nome_completo}'), t(', '),
    v('{cliente.nacionalidade}'), t(', '),
    v('{cliente.estado_civil}'), t(', inscrito(a) no CPF sob nº '),
    v('{cliente.cpf}'), t(', RG '), v('{cliente.rg}'), t(' '), v('{cliente.rg_orgao_emissor}'),
    t(', nascido(a) em '), v('{cliente.data_nascimento}'),
    t(', filho(a) de '), v('{cliente.nome_mae}'),
    t(', residente na '), v('{endereco.logradouro}'), t(', Nº '), v('{endereco.numero}'),
    v('{endereco.complemento_formatado}'), t(', Bairro: '), v('{endereco.bairro}'),
    t(', '), v('{endereco.cidade}'), t(' ('), v('{endereco.uf}'), t('), CEP.: '), v('{endereco.cep}'),
    t(', ASSINO, conjuntamente, com duas Testemunhas (A ROGO) abaixo;'),
  ));
  ch.push(blocoTag('{/bloco_contratante_a_rogo}'));

  // Menor
  ch.push(blocoTag('{#bloco_contratante_menor}'));
  ch.push(pj(
    v('{cliente.nome_completo}'), t(' (Menor, '), v('{cliente.condicao_menor}'), t('), '),
    v('{cliente.nacionalidade}'), t(', '),
    v('{cliente.estado_civil}'), t(', inscrito(a) no CPF sob nº '),
    v('{cliente.cpf}'), t(', RG: '), v('{cliente.rg}'),
    t(', nascido(a) em '), v('{cliente.data_nascimento}'),
    t(', Representado(a) por seu(sua) '),
    v('{representante.parentesco}'), t(' '),
    v('{representante.nome_completo}'),
    t(' (CPF: '), v('{representante.cpf}'), t(', RG: '), v('{representante.rg}'), t(')'),
    t(', ambos residentes na '), v('{endereco.logradouro}'), t(', Nº '), v('{endereco.numero}'),
    v('{endereco.complemento_formatado}'), t(', Bairro: '), v('{endereco.bairro}'),
    t(', Cidade: '), v('{endereco.cidade}'), t(' ('), v('{endereco.uf}'), t('), CEP.: '), v('{endereco.cep}'), t(';'),
  ));
  ch.push(blocoTag('{/bloco_contratante_menor}'));
}

// ─── Assinaturas contrato (bloco E — 3 variantes) ────────────────────────────

function assinaturasContrato(ch) {
  const pTeste = () => new Paragraph({
    children: [t('Testemunhas:')],
    alignment: AlignmentType.LEFT,
    spacing: { before: 0, after: 240 }, // 1 linha de respiro antes da tabela
  });

  // ── Adulto capaz ──
  ch.push(blocoTag('{#bloco_assinatura_adulto}'));
  ch.push(pl(LINHA_PLENA));
  ch.push(plr(v('{cliente.nome_completo}')));
  ch.push(pl('Contratante'));
  ch.push(esp(300));
  sigContratadas(ch);
  ch.push(esp(480)); // 2 linhas entre Contratadas e Testemunhas
  ch.push(pTeste());
  ch.push(sig2col(
    [LINHA_COL, 'Nome:', 'CPF:'],
    [LINHA_COL, 'Nome:', 'CPF:'],
  ));
  ch.push(blocoTag('{/bloco_assinatura_adulto}'));

  // ── A rogo ──
  ch.push(blocoTag('{#bloco_assinatura_a_rogo}'));
  ch.push(pl(LINHA_PLENA));
  ch.push(plr(v('{cliente.nome_completo}')));
  ch.push(pl('Contratante'));
  ch.push(esp(300));
  sigContratadas(ch);
  ch.push(esp(480)); // 2 linhas entre Contratadas e Testemunhas
  ch.push(pTeste());
  ch.push(sig2col(
    [
      LINHA_COL,
      'A ROGO',
      'Nome: {testemunhas[0].nome_completo}',
      'CPF: {testemunhas[0].cpf}',
      'RG: {testemunhas[0].rg}',
      'Nasc: {testemunhas[0].data_nascimento}',
    ],
    [
      LINHA_COL,
      'A ROGO',
      'Nome: {testemunhas[1].nome_completo}',
      'CPF: {testemunhas[1].cpf}',
      'RG: {testemunhas[1].rg}',
      'Nasc: {testemunhas[1].data_nascimento}',
    ],
  ));
  ch.push(blocoTag('{/bloco_assinatura_a_rogo}'));

  // ── Menor ──
  ch.push(blocoTag('{#bloco_assinatura_menor}'));
  ch.push(pl(LINHA_PLENA));
  ch.push(plr(v('{cliente.nome_completo}')));
  ch.push(plr(v('{representante.parentesco}'), t(': '), v('{representante.nome_completo}')));
  ch.push(plr(t('RG: '), v('{representante.rg}')));
  ch.push(plr(t('CPF: '), v('{representante.cpf}')));
  ch.push(esp(300));
  sigContratadas(ch);
  ch.push(esp(480)); // 2 linhas entre Contratadas e Testemunhas
  ch.push(pTeste());
  ch.push(sig2col([LINHA_COL], [LINHA_COL]));
  ch.push(blocoTag('{/bloco_assinatura_menor}'));
}

// ─── CONTRATO ─────────────────────────────────────────────────────────────────

function buildContrato() {
  const ch = [];

  ch.push(titulo('CONTRATO DE PRESTAÇÃO DE SERVIÇOS ADVOCATÍCIOS'));

  // CONTRATANTE: label + 3 variantes de qualificação
  ch.push(pj(b('CONTRATANTE: ')));
  qualificacaoContratante(ch);

  ch.push(esp(100));

  // CONTRATADA — Ambas
  ch.push(blocoTag('{#tem_duas_advogadas}'));
  ch.push(pj(
    b('CONTRATADA: '),
    v('{escritorio.adv1_nome}'), t(', Advogada, inscrita na Ordem dos Advogados do Brasil, sob nº '),
    v('{escritorio.adv1_oab}'), t(', Email: '), v('{escritorio.adv1_email}'),
    t(' e '),
    v('{escritorio.adv2_nome}'), t(', inscrita na OAB sob nº '), v('{escritorio.adv2_oab}'),
    t(', com endereço na '), v('{escritorio.endereco_logradouro}'), t(', Nº '), v('{escritorio.endereco_numero}'),
    t(', '), v('{escritorio.endereco_complemento}'),
    t(', Bairro: '), v('{escritorio.endereco_bairro}'),
    t(', '), v('{escritorio.endereco_cidade}'), t(' – '), v('{escritorio.endereco_uf}'),
    t(', CEP: '), v('{escritorio.endereco_cep}'),
    t(', e-mail: '), v('{escritorio.adv2_email}'), t(';'),
  ));
  ch.push(blocoTag('{/tem_duas_advogadas}'));
  // CONTRATADA — Apenas Lidiane
  ch.push(blocoTag('{^tem_duas_advogadas}'));
  ch.push(blocoTag('{#mostrar_lidiane}'));
  ch.push(pj(
    b('CONTRATADA: '),
    v('{escritorio.adv1_nome}'), t(', Advogada, inscrita na Ordem dos Advogados do Brasil, sob nº '),
    v('{escritorio.adv1_oab}'), t(', Email: '), v('{escritorio.adv1_email}'),
    t(', com endereço na '), v('{escritorio.endereco_logradouro}'), t(', Nº '), v('{escritorio.endereco_numero}'),
    t(', '), v('{escritorio.endereco_complemento}'),
    t(', Bairro: '), v('{escritorio.endereco_bairro}'),
    t(', '), v('{escritorio.endereco_cidade}'), t(' – '), v('{escritorio.endereco_uf}'),
    t(', CEP: '), v('{escritorio.endereco_cep}'), t(';'),
  ));
  ch.push(blocoTag('{/mostrar_lidiane}'));
  // CONTRATADA — Apenas Alcione
  ch.push(blocoTag('{#mostrar_alcione}'));
  ch.push(pj(
    b('CONTRATADA: '),
    v('{escritorio.adv2_nome}'), t(', Advogada, inscrita na Ordem dos Advogados do Brasil, sob nº '),
    v('{escritorio.adv2_oab}'), t(', Email: '), v('{escritorio.adv2_email}'),
    t(', com endereço na '), v('{escritorio.endereco_logradouro}'), t(', Nº '), v('{escritorio.endereco_numero}'),
    t(', '), v('{escritorio.endereco_complemento}'),
    t(', Bairro: '), v('{escritorio.endereco_bairro}'),
    t(', '), v('{escritorio.endereco_cidade}'), t(' – '), v('{escritorio.endereco_uf}'),
    t(', CEP: '), v('{escritorio.endereco_cep}'), t(';'),
  ));
  ch.push(blocoTag('{/mostrar_alcione}'));
  ch.push(blocoTag('{/tem_duas_advogadas}'));

  ch.push(esp(100));
  ch.push(pj('Tem, entre si, justo e acertado o presente Contrato de Prestação de Serviços Advocatícios, que será regido pelas cláusulas e condições descritas no presente;'));

  // ── Cláusula 1ª — Objeto (com placeholder do benefício) ──────────────────
  ch.push(new Paragraph({
    children: [
      b('Cláusula 1ª. '),
      t('O presente instrumento tem como OBJETO a prestação de serviços advocatícios, consubstanciado na defesa dos interesses do Contratante em face do INSS – INSTITUTO NACIONAL DO SEGURO SOCIAL, para fins de '),
      v('{processo.tipo_beneficio_descricao}'), t(';'),
    ],
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 240, after: 160 },
  }));

  // ── Cláusula 2ª — FIXA ────────────────────────────────────────────────────
  ch.push(new Paragraph({
    children: [b('Cláusula 2ª. '), t('As atividades inclusas na prestação de serviço objeto deste instrumento são todas aquelas inerentes à profissão, quais sejam: praticar todos os atos inerentes ao exercício da advocacia e aqueles constantes no Estatuto da Ordem dos Advogados do Brasil, bem como os especificados no Instrumento Procuratório;')],
    alignment: AlignmentType.JUSTIFIED, spacing: { before: 200, after: 160 },
  }));

  // ── Cláusula 3ª — FIXA ────────────────────────────────────────────────────
  ch.push(new Paragraph({
    children: [b('Cláusula 3ª. '), t('Todas as despesas efetuadas pela CONTRATADA, relacionadas ao processo em comento, incluindo-se fotocópias, emolumentos, viagens, custas, entre outros, ficarão a cargo do CONTRATANTE, desde que comprovadas, mediante apresentação de recibo original de desembolso;')],
    alignment: AlignmentType.JUSTIFIED, spacing: { before: 200, after: 160 },
  }));

  // ── Cláusula 4ª — Honorários (3 variantes, todas começam com a mesma fórmula)

  // Variante 1: padrão (adulto, qualquer benefício exceto MS) — com 3 parágrafos
  ch.push(blocoTag('{#bloco_honorarios_padrao}'));
  ch.push(new Paragraph({
    children: [
      b('Cláusula 4ª. '),
      t('Fica acordado entre as partes que os honorários advocatícios foram fixados em '),
      v('{honorarios.qtd_salarios}'), t(' ('), v('{honorarios.qtd_salarios_extenso}'),
      t(') salários de benefício, sendo os primeiros salários, acrescido de '),
      v('{honorarios.percentual_padrao}'), t('% ('), v('{honorarios.percentual_padrao_extenso}'),
      t(') dos salários atrasados pagos pelo INSS, resguardados os honorários sucumbenciais fixados judicialmente na forma do Estatuto da Advocacia, autorizada a reserva de honorários no alvará judicial ou RPV, nos termos do art. 22, §4º da Lei 8.906-94.'),
    ],
    alignment: AlignmentType.JUSTIFIED, spacing: { before: 200, after: 120 },
  }));
  ch.push(pj(
    t('Parágrafo Primeiro: Os '), v('{honorarios.qtd_salarios_extenso}'),
    t(' salários serão aqueles em vigência na data do pagamento feito pelo INSS;'),
  ));
  ch.push(pj(
    t('Parágrafo Segundo: Em caso de obtenção do benefício em grau de recurso será cobrado '),
    v('{honorarios.percentual_recurso}'), t('% ('), v('{honorarios.percentual_recurso_extenso}'),
    t(') dos salários em atraso pagos pelo INSS;'),
  ));
  ch.push(pj('Parágrafo Terceiro: A falta de pagamento dos honorários, autoriza as Contratadas a efetuarem o CANCELAMENTO do benefício adquirido junto ao INSS;'));
  ch.push(blocoTag('{/bloco_honorarios_padrao}'));

  // Variante 2: menor — sem parágrafos, mesma fórmula de abertura
  ch.push(blocoTag('{#bloco_honorarios_menor}'));
  ch.push(new Paragraph({
    children: [
      b('Cláusula 4ª. '),
      t('Fica acordado entre as partes que os honorários advocatícios foram fixados em '),
      v('{honorarios.qtd_salarios}'), t(' ('), v('{honorarios.qtd_salarios_extenso}'),
      t(') salários de benefício, sendo os primeiros salários, acrescido de '),
      v('{honorarios.percentual_padrao}'), t('% ('), v('{honorarios.percentual_padrao_extenso}'),
      t(') dos pagamentos em atraso (retroativos pagos pelo INSS), resguardados os honorários sucumbenciais fixados judicialmente na forma do Estatuto da Advocacia, autorizada a reserva de honorários no alvará judicial ou RPV, nos termos do art. 22, §4º da Lei 8.906-94.'),
    ],
    alignment: AlignmentType.JUSTIFIED, spacing: { before: 200, after: 160 },
  }));
  ch.push(blocoTag('{/bloco_honorarios_menor}'));

  // Variante 3: Mandado de Segurança — valor fixo, mesma fórmula de abertura
  ch.push(blocoTag('{#bloco_honorarios_mandado_seguranca}'));
  ch.push(new Paragraph({
    children: [
      b('Cláusula 4ª. '),
      t('Fica acordado entre as partes que os honorários advocatícios foram fixados em R$ '),
      v('{honorarios.valor_fixo}'), t(' ('), v('{honorarios.valor_fixo_extenso}'),
      t('), pagos da seguinte forma: 50% (cinquenta por cento) no ato da assinatura deste instrumento e 50% (cinquenta por cento) na obtenção da liminar ou da sentença favorável, resguardados os honorários sucumbenciais fixados judicialmente na forma do art. 85 do Código de Processo Civil e do Estatuto da Advocacia (Lei 8.906/94).'),
    ],
    alignment: AlignmentType.JUSTIFIED, spacing: { before: 200, after: 160 },
  }));
  ch.push(blocoTag('{/bloco_honorarios_mandado_seguranca}'));

  // ── Cláusula 5ª — Desistência (com variável de multa) ────────────────────
  ch.push(new Paragraph({
    children: [
      b('Cláusula 5ª. '),
      t('A desistência da ação ou falta de entrega de documentos essenciais ao andamento da ação que impliquem em extinção do processo, acarretará a aplicação de multa equivalente a '),
      v('{multa.qtd_salarios_minimos}'), t(' ('), v('{multa.qtd_salarios_minimos_extenso}'),
      t(') salários mínimos à época da desistência ou extinção;'),
    ],
    alignment: AlignmentType.JUSTIFIED, spacing: { before: 200, after: 160 },
  }));

  // ── Cláusula 6ª — FIXA ────────────────────────────────────────────────────
  ch.push(new Paragraph({
    children: [b('Cláusula 6ª. '), t('O Substabelecimento sem reservas de poderes ou Rescisão Contratual implicará em pagamento de honorários advocatícios, proporcionalmente, à atuação da Contratada no processo, na forma do Estatuto da OAB/SP.')],
    alignment: AlignmentType.JUSTIFIED, spacing: { before: 200, after: 160 },
  }));

  // ── Cláusula 7ª — Foro ────────────────────────────────────────────────────
  ch.push(new Paragraph({
    children: [
      b('Cláusula 7ª. '),
      t('Para resolver quaisquer controvérsias decorrentes do CONTRATO, as partes elegem o foro '),
      v('{escritorio.foro_eleito}'), t('.'),
    ],
    alignment: AlignmentType.JUSTIFIED, spacing: { before: 200, after: 160 },
  }));

  ch.push(esp(100));
  ch.push(pj('Por estarem assim de acordo, firmam o presente instrumento, em duas vias de igual teor.'));
  ch.push(esp(160));

  // Data
  ch.push(pc(
    v('{doc.cidade_assinatura}'), t(', '),
    v('{doc.dia_assinatura}'), t(' de '),
    v('{doc.mes_assinatura_extenso}'), t(' de '),
    v('{doc.ano_assinatura}'), t('.'),
  ));
  ch.push(esp(720)); // 3 linhas de respiro antes da assinatura do Contratante

  // Assinaturas (3 variantes)
  assinaturasContrato(ch);

  return new Document({
    sections: [{
      properties: { page: { margin: { top: 1440, right: 1134, bottom: 1440, left: 1134 } } },
      children: ch,
    }],
  });
}

// ─── PROCURAÇÃO ───────────────────────────────────────────────────────────────

function buildProcuracao() {
  const ch = [];

  const PODERES = 'conferindo-lhes amplos poderes para o foro em geral, com cláusula "ad-judicia et extra", podendo atuar em qualquer Juízo, Instância ou Tribunal, podendo propor contra quem de direito, as ações competentes e defendê-lo(a) nas contrárias, seguindo umas e outras, até final decisão, usando os recursos legais e acompanhando-os, conferindo-lhes ainda, poderes especiais para receber citação inicial, confessar, e conhecer a procedência do pedido, desistir, renunciar ao direito sobre o que se funda a ação, transigir, firmar compromissos ou acordos, receber e dar quitações, podendo agir em Juízo ou fora dele, assim como substabelecer esta a outrem, com ou sem reservas de iguais poderes, para agir em conjunto ou separadamente com o substabelecido.';

  // Sufixo com advogadas + objeto + poderes — condicional por seleção de advogada
  const enderecoAdv = [
    v('{escritorio.endereco_logradouro}'), t(', Nº '), v('{escritorio.endereco_numero}'),
    t(', '), v('{escritorio.endereco_complemento}'),
    t(', Bairro: '), v('{escritorio.endereco_bairro}'),
    t(', '), v('{escritorio.endereco_cidade}'), t(' – '), v('{escritorio.endereco_uf}'),
    t(', CEP: '), v('{escritorio.endereco_cep}'),
  ];
  const runsAdvogadasPoderes = [
    // Ambas
    v('{#tem_duas_advogadas}'),
    t('constitui suas bastante procuradoras as Advogadas '),
    v('{escritorio.adv1_nome}'),
    t(' (email: '), v('{escritorio.adv1_email}'), t('), OAB '), v('{escritorio.adv1_oab}'),
    t(', e '),
    v('{escritorio.adv2_nome}'),
    t(' (email: '), v('{escritorio.adv2_email}'), t('), OAB '), v('{escritorio.adv2_oab}'),
    t(', ambas com endereço na '),
    ...enderecoAdv,
    t(', conferindo-lhes poderes específicos para '),
    v('{processo.objeto_procuracao}'),
    t(', '), t(PODERES),
    v('{/tem_duas_advogadas}'),
    // Apenas Lidiane
    v('{#apenas_lidiane}'),
    t('constitui sua bastante procuradora a Advogada '),
    v('{escritorio.adv1_nome}'),
    t(' (email: '), v('{escritorio.adv1_email}'), t('), OAB '), v('{escritorio.adv1_oab}'),
    t(', com endereço na '),
    ...enderecoAdv,
    t(', conferindo-lhe poderes específicos para '),
    v('{processo.objeto_procuracao}'),
    t(', '), t(PODERES),
    v('{/apenas_lidiane}'),
    // Apenas Alcione
    v('{#apenas_alcione}'),
    t('constitui sua bastante procuradora a Advogada '),
    v('{escritorio.adv2_nome}'),
    t(' (email: '), v('{escritorio.adv2_email}'), t('), OAB '), v('{escritorio.adv2_oab}'),
    t(', com endereço na '),
    ...enderecoAdv,
    t(', conferindo-lhe poderes específicos para '),
    v('{processo.objeto_procuracao}'),
    t(', '), t(PODERES),
    v('{/apenas_alcione}'),
  ];

  ch.push(titulo('PROCURAÇÃO "AD JUDICIA E ET EXTRA"'));
  ch.push(esp(200));

  // ── Adulto capaz ──
  ch.push(blocoTag('{#bloco_contratante_maior_capaz}'));
  ch.push(pj(
    v('{cliente.nome_completo}'), t(', '),
    v('{cliente.nacionalidade}'), t(', '),
    v('{cliente.estado_civil}'), t(', inscrito(a) no CPF sob nº'),
    v('{cliente.cpf}'), t(', RG '), v('{cliente.rg}'), t(' '), v('{cliente.rg_orgao_emissor}'),
    t(', nascido(a) em '), v('{cliente.data_nascimento}'),
    t(', filho(a) de '), v('{cliente.nome_mae}'),
    t(', residente na '), v('{endereco.logradouro}'), t(', Nº '), v('{endereco.numero}'),
    v('{endereco.complemento_formatado}'), t(', '), v('{endereco.bairro}'),
    t(' CEP '), v('{endereco.cep}'), t(', '), v('{endereco.cidade}'), t(' ('), v('{endereco.uf}'), t('), '),
    ...runsAdvogadasPoderes,
  ));
  ch.push(blocoTag('{/bloco_contratante_maior_capaz}'));

  // ── A rogo ──
  ch.push(blocoTag('{#bloco_contratante_a_rogo}'));
  ch.push(pj(
    v('{cliente.nome_completo}'), t(', '),
    v('{cliente.nacionalidade}'), t(', '),
    v('{cliente.estado_civil}'), t(', inscrito(a) no CPF sob nº'),
    v('{cliente.cpf}'), t(', RG '), v('{cliente.rg}'), t(' '), v('{cliente.rg_orgao_emissor}'),
    t(', nascido(a) em '), v('{cliente.data_nascimento}'),
    t(', filho(a) de '), v('{cliente.nome_mae}'),
    t(', residente na '), v('{endereco.logradouro}'), t(', Nº '), v('{endereco.numero}'),
    v('{endereco.complemento_formatado}'), t(', '), v('{endereco.bairro}'),
    t(' CEP '), v('{endereco.cep}'), t(', '), v('{endereco.cidade}'), t(' ('), v('{endereco.uf}'), t('), '),
    t('por não saber/não poder assinar (testemunhas a rogo abaixo), '),
    ...runsAdvogadasPoderes,
  ));
  ch.push(blocoTag('{/bloco_contratante_a_rogo}'));

  // ── Menor ──
  ch.push(blocoTag('{#bloco_contratante_menor}'));
  ch.push(pj(
    v('{cliente.nome_completo}'), t(' (Menor, '), v('{cliente.condicao_menor}'), t('), '),
    v('{cliente.nacionalidade}'), t(', '),
    v('{cliente.estado_civil}'), t(', inscrito(a) no CPF sob nº.'),
    v('{cliente.cpf}'), t(', RG: '), v('{cliente.rg}'),
    t(', nascido(a) em '), v('{cliente.data_nascimento}'),
    t(', Representado(a) por seu(sua) '),
    v('{representante.parentesco}'), t(' '),
    v('{representante.nome_completo}'),
    t(' (CPF: '), v('{representante.cpf}'), t(', RG: '), v('{representante.rg}'), t(')'),
    t(', ambos residentes na '), v('{endereco.logradouro}'), t(', Nº '), v('{endereco.numero}'),
    v('{endereco.complemento_formatado}'), t(', Bairro: '), v('{endereco.bairro}'),
    t(', Cidade: '), v('{endereco.cidade}'), t(' ('), v('{endereco.uf}'), t('), CEP.: '), v('{endereco.cep}'), t(', '),
    ...runsAdvogadasPoderes,
  ));
  ch.push(blocoTag('{/bloco_contratante_menor}'));

  ch.push(esp(400));

  // Data
  ch.push(pc(
    v('{doc.cidade_assinatura}'), t(', '),
    v('{doc.dia_assinatura}'), t(' de '),
    v('{doc.mes_assinatura_extenso}'), t(' de '),
    v('{doc.ano_assinatura}'), t('.'),
  ));
  ch.push(esp(400));

  // ── Assinatura adulto ──
  ch.push(blocoTag('{#bloco_assinatura_adulto}'));
  ch.push(new Paragraph({
    children: [t(LINHA_PLENA)],
    alignment: AlignmentType.CENTER,
    spacing: { after: 40 },
  }));
  ch.push(pc(v('{cliente.nome_completo}')));
  ch.push(blocoTag('{/bloco_assinatura_adulto}'));

  // ── Assinatura a rogo ──
  ch.push(blocoTag('{#bloco_assinatura_a_rogo}'));
  ch.push(new Paragraph({
    children: [t(LINHA_PLENA)],
    alignment: AlignmentType.CENTER,
    spacing: { after: 40 },
  }));
  ch.push(pc(v('{cliente.nome_completo}')));
  ch.push(esp(200));
  ch.push(pl('Testemunhas a rogo:'));
  ch.push(sig2col(
    [
      LINHA_COL,
      'A ROGO',
      'Nome: {testemunhas[0].nome_completo}',
      'CPF: {testemunhas[0].cpf}',
      'RG: {testemunhas[0].rg}',
      'Nasc: {testemunhas[0].data_nascimento}',
    ],
    [
      LINHA_COL,
      'A ROGO',
      'Nome: {testemunhas[1].nome_completo}',
      'CPF: {testemunhas[1].cpf}',
      'RG: {testemunhas[1].rg}',
      'Nasc: {testemunhas[1].data_nascimento}',
    ],
  ));
  ch.push(blocoTag('{/bloco_assinatura_a_rogo}'));

  // ── Assinatura menor ──
  ch.push(blocoTag('{#bloco_assinatura_menor}'));
  ch.push(new Paragraph({
    children: [t(LINHA_PLENA)],
    alignment: AlignmentType.CENTER,
    spacing: { after: 40 },
  }));
  ch.push(pc(v('{cliente.nome_completo}')));
  ch.push(pc(t('Nome da '), v('{representante.parentesco}'), t(': '), v('{representante.nome_completo}')));
  ch.push(pc(t('RG ('), v('{representante.parentesco}'), t('): '), v('{representante.rg}')));
  ch.push(pc(t('CPF ('), v('{representante.parentesco}'), t('): '), v('{representante.cpf}')));
  ch.push(blocoTag('{/bloco_assinatura_menor}'));

  return new Document({
    sections: [{
      properties: { page: { margin: { top: 1440, right: 1134, bottom: 1440, left: 1134 } } },
      children: ch,
    }],
  });
}

// ─── Pós-processamento: remove bordas da tabela ───────────────────────────────
// Replica exatamente o XML que o Word grava ao clicar "Sem bordas" na UI:
// tblBorders com none+auto em todas as posições, e NENHUM tcBorders nas células.
// Word ignora val="nil" em tcBorders (bug no macOS), mas respeita none+auto no tblPr.

const NO_TBL_BORDERS =
  '<w:tblBorders>' +
  '<w:top w:val="none" w:sz="0" w:space="0" w:color="auto"/>' +
  '<w:left w:val="none" w:sz="0" w:space="0" w:color="auto"/>' +
  '<w:bottom w:val="none" w:sz="0" w:space="0" w:color="auto"/>' +
  '<w:right w:val="none" w:sz="0" w:space="0" w:color="auto"/>' +
  '<w:insideH w:val="none" w:sz="0" w:space="0" w:color="auto"/>' +
  '<w:insideV w:val="none" w:sz="0" w:space="0" w:color="auto"/>' +
  '</w:tblBorders>';

function fixDocx(buf) {
  const zip = new PizZip(buf);
  let xml = zip.file('word/document.xml').asText();
  // Corrigir tblGrid: a lib gera w="100" (placeholder) — Google Docs usa o grid para larguras
  // 4819 twips = metade da área de conteúdo A4 (9638 / 2)
  xml = xml.replace(/<w:tblGrid>[\s\S]*?<\/w:tblGrid>/g,
    '<w:tblGrid><w:gridCol w:w="4819"/><w:gridCol w:w="4819"/></w:tblGrid>');
  // Corrigir larguras da tabela e células em DXA absoluto
  xml = xml.replace(/<w:tblW[^>]*>/g, '<w:tblW w:type="dxa" w:w="9638"/>');
  xml = xml.replace(/<w:tcW[^>]*>/g,  '<w:tcW w:type="dxa" w:w="4819"/>');
  // Remover tcBorders; substituir tblBorders pelo formato nativo do Word
  xml = xml.replace(/<w:tcBorders>[\s\S]*?<\/w:tcBorders>/g, '');
  xml = xml.replace(/<w:tblBorders>[\s\S]*?<\/w:tblBorders>/g, '');
  xml = xml.replace(/<\/w:tblPr>/g, NO_TBL_BORDERS + '</w:tblPr>');
  zip.file('word/document.xml', xml);
  return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
}

// ─── Renderizar com docxtemplater ─────────────────────────────────────────────

function renderizar(templateBuffer, contexto) {
  const zip = new PizZip(templateBuffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    parser: angularParser,
    nullGetter() { return '_______________'; },
  });
  doc.render(contexto);
  return doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
}

// ─── Verificação de texto via mammoth ────────────────────────────────────────

async function verificar(nomeArquivo, buffer) {
  const { value } = await mammoth.extractRawText({ buffer });
  const erros = [];

  // 1. Cláusula 1ª não pode terminar com "para fins de "
  if (/para fins de\s*;/.test(value) || /para fins de\s*$/.test(value.slice(0, 500))) {
    erros.push('Bug 3: Cláusula 1ª cortada (placeholder ausente)');
  }
  if (!value.includes('para fins de ') || (!value.includes('BENEFÍCIO') && !value.includes('MANDADO') && !value.includes('APOSENTADORIA'))) {
    // ok se o arquivo não tem cláusula 1 (procuração)
  }

  // 2. Bug 4: todas as variantes de cláusula 4 devem começar com "Fica acordado"
  const cl4matches = value.match(/Cláusula 4[ªa°]\./g) ?? [];
  if (cl4matches.length > 0) {
    const segments = value.split(/Cláusula 4[ªa°]\./);
    for (let i = 1; i < segments.length; i++) {
      if (!segments[i].trim().startsWith('Fica acordado')) {
        erros.push(`Bug 4: Cláusula 4ª não começa com "Fica acordado" (instância ${i})`);
      }
    }
  }

  // 3. Bug 5: testemunhas a rogo devem ter Nasc
  if (value.includes('A ROGO') && !value.includes('Nasc:')) {
    erros.push('Bug 5: Testemunhas a rogo sem campo Nasc:');
  }

  if (erros.length === 0) {
    console.log(`  ✅ ${nomeArquivo} — sem erros de conteúdo`);
  } else {
    erros.forEach(e => console.error(`  ❌ ${nomeArquivo}: ${e}`));
  }
  return erros.length === 0;
}

// ─── Run ──────────────────────────────────────────────────────────────────────

console.log('Gerando templates DOCX de produção...\n');

const contratoDoc  = buildContrato();
const procuracaoDoc = buildProcuracao();
const contratoBuf  = fixDocx(await Packer.toBuffer(contratoDoc));
const procuracaoBuf = fixDocx(await Packer.toBuffer(procuracaoDoc));

// Gravar nos templates de produção (01-08)
const TEMPLATES_DIR = path.join(__dirname, '../templates');
const templatesProd = [
  ['01_contrato_bpc_adulto.docx',       contratoBuf],
  ['02_contrato_bpc_a_rogo.docx',       contratoBuf],
  ['03_contrato_bpc_menor_16.docx',     contratoBuf],
  ['04_contrato_bpc_menor_16_a_18.docx',contratoBuf],
  ['05_procuracao_bpc_adulto.docx',     procuracaoBuf],
  ['06_procuracao_bpc_menor_16.docx',   procuracaoBuf],
  ['07_procuracao_bpc_16_a_18.docx',    procuracaoBuf],
  ['08_procuracao_mandado_seguranca.docx', procuracaoBuf],
];
for (const [nome, buf] of templatesProd) {
  fs.writeFileSync(path.join(TEMPLATES_DIR, nome), buf);
}
console.log('✅ Templates de produção gravados em templates/ (01–08)\n');

// Cópia na pasta de saída local (validação visual)
fs.writeFileSync(path.join(OUTPUT_DIR, '01_contrato_honorarios.docx'), contratoBuf);
fs.writeFileSync(path.join(OUTPUT_DIR, '02_procuracao.docx'), procuracaoBuf);

console.log('Renderizando variantes de teste...');

const CTX_ADULTO_BPC_LIDIANE = {
  ...CTX_ADULTO_BPC,
  tem_duas_advogadas: false, mostrar_lidiane: true, mostrar_alcione: false,
  apenas_lidiane: true, apenas_alcione: false,
};
const CTX_ADULTO_BPC_ALCIONE = {
  ...CTX_ADULTO_BPC,
  tem_duas_advogadas: false, mostrar_lidiane: false, mostrar_alcione: true,
  apenas_lidiane: false, apenas_alcione: true,
};

const cenarios = [
  { nome: '01_contrato_ADULTO_BPC',          buf: contratoBuf,   ctx: CTX_ADULTO_BPC },
  { nome: '01_contrato_ADULTO_BPC_LIDIANE',  buf: contratoBuf,   ctx: CTX_ADULTO_BPC_LIDIANE },
  { nome: '01_contrato_ADULTO_BPC_ALCIONE',  buf: contratoBuf,   ctx: CTX_ADULTO_BPC_ALCIONE },
  { nome: '01_contrato_MENOR_BPC',           buf: contratoBuf,   ctx: CTX_MENOR_BPC  },
  { nome: '01_contrato_AROGO_BPC',           buf: contratoBuf,   ctx: CTX_AROGO_BPC  },
  { nome: '01_contrato_ADULTO_MS',           buf: contratoBuf,   ctx: CTX_ADULTO_MS  },
  { nome: '02_procuracao_ADULTO_BPC',        buf: procuracaoBuf, ctx: CTX_ADULTO_BPC },
  { nome: '02_procuracao_ADULTO_BPC_LIDIANE',buf: procuracaoBuf, ctx: CTX_ADULTO_BPC_LIDIANE },
  { nome: '02_procuracao_ADULTO_BPC_ALCIONE',buf: procuracaoBuf, ctx: CTX_ADULTO_BPC_ALCIONE },
  { nome: '02_procuracao_MENOR_BPC',         buf: procuracaoBuf, ctx: CTX_MENOR_BPC  },
  { nome: '02_procuracao_ADULTO_MS',         buf: procuracaoBuf, ctx: CTX_ADULTO_MS  },
];

let totalOk = 0;
let totalErro = 0;

for (const { nome, buf, ctx } of cenarios) {
  try {
    const rendered = renderizar(buf, ctx);
    fs.writeFileSync(path.join(OUTPUT_DIR, `${nome}.docx`), rendered);
    const ok = await verificar(nome, rendered);
    if (ok) totalOk++; else totalErro++;
  } catch (e) {
    console.error(`  ❌ ${nome}: ERRO DE RENDERIZAÇÃO — ${e.message}`);
    if (e.properties?.errors) e.properties.errors.forEach(err => console.error('     ', err.message));
    totalErro++;
  }
}

console.log(`\n${totalOk + totalErro} arquivos | ${totalOk} OK | ${totalErro} com erro`);
if (totalErro === 0) {
  console.log('🎉 Todos os checks automáticos passaram. Abra scripts/output/ para validação visual.');
} else {
  console.log('⚠️  Há erros — verifique acima.');
}

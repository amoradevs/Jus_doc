/**
 * Gera 14_termo_representacao_inss.docx
 * Execute: node scripts/generate-termo-representacao.mjs
 *
 * Especificações: Arial 11pt corpo / 12pt títulos
 * Margens: 1,5cm sup/inf — 2cm laterais
 * Entrelinha 1.15 — espaçamento 4pt entre parágrafos
 * DocxTemplater tags embutidas para uso em produção
 */

import {
  Document, Paragraph, TextRun, AlignmentType, Packer,
  Table, TableRow, TableCell, WidthType, BorderStyle, TableLayoutType,
} from 'docx';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import PizZip from 'pizzip';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../templates/14_termo_representacao_inss.docx');

const FONT = 'Arial';
const SZ = 22;        // 11pt em half-points
const SZ_TIT = 24;   // 12pt em half-points
const SZ_CP = 18;    // 9pt para Código Penal compactado
// Twips: 1cm ≈ 567, 1.5cm = 851, 2cm = 1134
const MARGIN_V = 851;
const MARGIN_H = 1134;
// Entrelinha 1.15 = 276/240
const LINE = 276;
// 4pt = 80 twips
const SP = 80;
const SP_NONE = 0;

const baseRun = (text, extra = {}) => new TextRun({ text, font: FONT, size: SZ, ...extra });
const boldRun = (text, sz = SZ) => new TextRun({ text, font: FONT, size: sz, bold: true });

const spacing = (before = SP, after = SP) => ({ before, after, line: LINE, lineRule: 'auto' });

// ── Tabela 2 colunas sem bordas (NIL + FFFFFF) ──────────────────────────────
const NO_BORDER = { style: BorderStyle.NIL, size: 0, color: 'FFFFFF' };
const CELL_BORDERS = { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER };

// A4 com margens 1,5cm sup/inf e 2cm laterais: 11906 - 1134 - 1134 = 9638 twips
const CELL_DXA = 4819;
const TABLE_DXA = 9638;

function sig2col(esqLinhas, dirLinhas) {
  const makeCell = (linhas) => new TableCell({
    width: { size: CELL_DXA, type: WidthType.DXA },
    borders: CELL_BORDERS,
    children: linhas.map(text => new Paragraph({
      children: [new TextRun({ text, font: FONT, size: SZ })],
      spacing: spacing(SP_NONE, SP_NONE),
      alignment: AlignmentType.LEFT,
    })),
  });
  return new Table({
    width: { size: TABLE_DXA, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    rows: [new TableRow({
      children: [makeCell(esqLinhas), makeCell(dirLinhas)],
    })],
  });
}

// Parágrafo de corpo (justificado)
const p = (runs, spBefore = SP, spAfter = SP) => new Paragraph({
  children: Array.isArray(runs) ? runs : [baseRun(runs)],
  spacing: spacing(spBefore, spAfter),
  alignment: AlignmentType.JUSTIFIED,
});

// Parágrafo centrado
const pC = (runs, spBefore = SP, spAfter = SP) => new Paragraph({
  children: Array.isArray(runs) ? runs : [boldRun(typeof runs === 'string' ? runs : '')],
  spacing: spacing(spBefore, spAfter),
  alignment: AlignmentType.CENTER,
});

// Parágrafo que contém APENAS uma tag DocxTemplater (sem espaçamento extra)
const pTag = (tag) => new Paragraph({
  children: [new TextRun({ text: tag, font: FONT, size: SZ })],
  spacing: spacing(SP_NONE, SP_NONE),
  alignment: AlignmentType.LEFT,
});

// Linha de benefício (sem espaçamento extra entre linhas da lista)
const pBen = (text) => new Paragraph({
  children: [baseRun(text)],
  spacing: spacing(SP_NONE, SP_NONE),
  alignment: AlignmentType.LEFT,
});

// Linha de assinatura
const pAssin = (text, spBefore = SP, spAfter = 0) => new Paragraph({
  children: [baseRun(text)],
  spacing: { before: spBefore, after: spAfter, line: LINE, lineRule: 'auto' },
  alignment: AlignmentType.LEFT,
});

const doc = new Document({
  sections: [{
    properties: {
      page: {
        margin: { top: MARGIN_V, bottom: MARGIN_V, left: MARGIN_H, right: MARGIN_H },
      },
    },
    children: [

      // ── Cabeçalho ────────────────────────────────────────────────────────
      pC([boldRun('INSTITUTO NACIONAL DO SEGURO SOCIAL', SZ_TIT)], SP_NONE, SP_NONE),
      pC([boldRun('TERMO DE REPRESENTAÇÃO E AUTORIZAÇÃO DE ACESSO A INFORMAÇÕES PREVIDENCIÁRIAS', SZ)], SP_NONE, SP),

      // ── Identificação do segurado ────────────────────────────────────────
      p('Eu, {cliente.nome_completo}, inscrito(a) no CPF nº {cliente.cpf}, RG nº {cliente.rg}, residente e domiciliado(a) em {endereco.logradouro}, {endereco.numero}{endereco.complemento_formatado}, {endereco.bairro}, no Município de {endereco.cidade}/{endereco.uf}, CEP {endereco.cep},', SP, SP_NONE),

      // ── Bloco da advogada (condicional) ──────────────────────────────────
      // Quando AMBAS
      pTag('{#tem_duas_advogadas}'),
      p('representado pelas advogadas {escritorio.adv1_nome}, CPF nº {escritorio.adv1_cpf}, OAB Nº {escritorio.adv1_oab}, e {escritorio.adv2_nome}, CPF nº {escritorio.adv2_cpf}, OAB Nº {escritorio.adv2_oab},', SP_NONE, SP_NONE),
      pTag('{/tem_duas_advogadas}'),
      // Quando apenas uma
      pTag('{^tem_duas_advogadas}'),
      pTag('{#mostrar_lidiane}'),
      p('representado pela advogada {escritorio.adv1_nome}, CPF nº {escritorio.adv1_cpf}, OAB Nº {escritorio.adv1_oab},', SP_NONE, SP_NONE),
      pTag('{/mostrar_lidiane}'),
      pTag('{#mostrar_alcione}'),
      p('representado pela advogada {escritorio.adv2_nome}, CPF nº {escritorio.adv2_cpf}, OAB Nº {escritorio.adv2_oab},', SP_NONE, SP_NONE),
      pTag('{/mostrar_alcione}'),
      pTag('{/tem_duas_advogadas}'),

      // ── Autorização ──────────────────────────────────────────────────────
      p('CONFIRO PODERES ESPECÍFICOS para me representar perante o INSS na solicitação do serviço ou benefício abaixo indicado e AUTORIZO o(a) referido(a) profissional a ter acesso apenas às informações pessoais necessárias a subsidiar o requerimento eletrônico do serviço ou benefício abaixo elencado:', SP, SP),

      // ── Lista de benefícios (sem espaçamento entre linhas) ───────────────
      pBen('I.    {checkbox.aposentadoria_idade} Aposentadoria por Idade   {checkbox.aposentadoria_idade_urbana} urbana   {checkbox.aposentadoria_idade_rural} rural'),
      pBen('II.   {checkbox.aposentadoria_tempo} Aposentadoria por Tempo de Contribuição'),
      pBen('III.  {checkbox.aposentadoria_especial} Aposentadoria Especial'),
      pBen('IV.   {checkbox.pensao_morte} Pensão por Morte Previdenciária   {checkbox.pensao_morte_urbana} urbana   {checkbox.pensao_morte_rural} rural'),
      pBen('V.    {checkbox.auxilio_reclusao} Auxílio-Reclusão   {checkbox.auxilio_reclusao_urbano} urbano   {checkbox.auxilio_reclusao_rural} rural'),
      pBen('VI.   {checkbox.salario_maternidade} Salário-Maternidade   {checkbox.salario_maternidade_urbano} urbano   {checkbox.salario_maternidade_rural} rural'),
      pBen('VII.  {checkbox.bpc} Benefício de Prestação Continuada – BPC/LOAS'),
      pBen('VIII. {checkbox.atualizacao_cadastral} Atualização Cadastral'),

      // ── Continuação ──────────────────────────────────────────────────────
      p('Podendo, para tanto, praticar os atos necessários ao cumprimento deste mandato, em especial, prestar informações, acompanhar requerimentos, cumprir exigências, ter vistas e tomar ciência de decisões sobre processos de requerimento de benefícios operacionalizados pelo Instituto.', SP, SP),

      // ── Assinatura do segurado ───────────────────────────────────────────
      p('{doc.cidade_assinatura}, {doc.dia_assinatura}/{doc.mes_assinatura_numero}/{doc.ano_assinatura}'),
      pAssin('_________________________', SP * 4),
      pAssin('Assinatura do(a) Representado(a)', 0, SP * 2),

      // ── Termo de Responsabilidade ────────────────────────────────────────
      new Paragraph({
        children: [boldRun('TERMO DE RESPONSABILIDADE', SZ)],
        spacing: { before: SP * 2, after: SP * 4, line: LINE, lineRule: 'auto' },
        alignment: AlignmentType.LEFT,
      }),
      p('Por este Termo de Responsabilidade, comprometo-me a comunicar ao INSS qualquer evento que possa anular esta Procuração, no prazo de trinta dias, a contar da data que o mesmo ocorra, principalmente o óbito do segurado / pensionista, mediante apresentação da respectiva certidão. Estou ciente de que o descumprimento do compromisso ora assumido, além de obrigar a devolução de importâncias recebidas indevidamente, quando for o caso, sujeitar-me-á às penalidades previstas nos arts. 171 e 299, ambos do Código Penal.', SP, SP),

      // ── Assinatura do procurador (condicional) ────────────────────────────
      p('{doc.cidade_assinatura}, {doc.dia_assinatura}/{doc.mes_assinatura_numero}/{doc.ano_assinatura}'),

      // Ambas: 2 colunas via Table sem bordas visíveis
      pTag('{#tem_duas_advogadas}'),
      sig2col(
        ['_________________________', '{escritorio.adv1_nome}', 'OAB {escritorio.adv1_oab}'],
        ['_________________________', '{escritorio.adv2_nome}', 'OAB {escritorio.adv2_oab}'],
      ),
      pTag('{/tem_duas_advogadas}'),

      // Apenas uma
      pTag('{^tem_duas_advogadas}'),
      pTag('{#mostrar_lidiane}'),
      pAssin('_________________________', SP * 4),
      pAssin('{escritorio.adv1_nome}', 0),
      pAssin('OAB {escritorio.adv1_oab}', 0, SP * 4),
      pTag('{/mostrar_lidiane}'),
      pTag('{#mostrar_alcione}'),
      pAssin('_________________________', SP * 4),
      pAssin('{escritorio.adv2_nome}', 0),
      pAssin('OAB {escritorio.adv2_oab}', 0, SP * 4),
      pTag('{/mostrar_alcione}'),
      pTag('{/tem_duas_advogadas}'),

      // ── Código Penal (compactado, 9pt) ────────────────────────────────────
      new Paragraph({
        children: [boldRun('CÓDIGO PENAL', SZ)],
        spacing: { before: SP * 2, after: SP, line: LINE, lineRule: 'auto' },
        alignment: AlignmentType.LEFT,
      }),
      new Paragraph({
        children: [new TextRun({
          text: 'Art. 171. Obter, para si ou para outrem, vantagem ilícita, em prejuízo alheio, induzindo ou manter alguém em erro, mediante artifício, ardil ou qualquer outro meio fraudulento. Art. 299. Omitir, em documento público ou particular, declaração que devia constar, ou nele inserir ou fazer inserir declaração falsa ou diversa da que devia ser escrita, com o fim de prejudicar direito, criar, obrigação ou alterar a verdade sobre fato juridicamente relevante.',
          font: FONT,
          size: SZ_CP,
        })],
        spacing: spacing(SP_NONE, SP_NONE),
        alignment: AlignmentType.JUSTIFIED,
      }),

    ],
  }],
});

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
  xml = xml.replace(/<w:tblGrid>[\s\S]*?<\/w:tblGrid>/g,
    '<w:tblGrid><w:gridCol w:w="4819"/><w:gridCol w:w="4819"/></w:tblGrid>');
  xml = xml.replace(/<w:tblW[^>]*>/g, '<w:tblW w:type="dxa" w:w="9638"/>');
  xml = xml.replace(/<w:tcW[^>]*>/g,  '<w:tcW w:type="dxa" w:w="4819"/>');
  xml = xml.replace(/<w:tcBorders>[\s\S]*?<\/w:tcBorders>/g, '');
  xml = xml.replace(/<w:tblBorders>[\s\S]*?<\/w:tblBorders>/g, '');
  xml = xml.replace(/<\/w:tblPr>/g, NO_TBL_BORDERS + '</w:tblPr>');
  zip.file('word/document.xml', xml);
  return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
}

const buf = fixDocx(await Packer.toBuffer(doc));
writeFileSync(OUT, buf);
console.log('✓ Gerado:', OUT);

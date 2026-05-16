/**
 * Gera 15_termo_responsabilidade.docx
 * Execute: node scripts/generate-termo-responsabilidade.mjs
 *
 * Estrutura fiel ao PDF de referência:
 *   docs/referencia_pensao_por_morte/TERMO DE RESPONSABILIDADE - PADRAO.pdf
 *
 * Texto dos Arts. 171 e 299 conforme Decreto-Lei 2.848/1940 (Código Penal),
 * verificado em planalto.gov.br e jusbrasil.com.br em 2026-05-15.
 * Versão do Art. 299 inclui parágrafo da pena, conforme o PDF de referência.
 *
 * Especificações: Arial 11pt corpo
 * Margens: 1,5cm sup/inf — 2cm laterais
 * Entrelinha 1.15 — espaçamento 4pt entre parágrafos
 */

import {
  Document, Paragraph, TextRun, AlignmentType, Packer, UnderlineType,
  Table, TableRow, TableCell, WidthType, BorderStyle, TableLayoutType,
} from 'docx';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import PizZip from 'pizzip';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../templates/15_termo_responsabilidade.docx');

const FONT    = 'Arial';
const SZ      = 22;       // 11pt em half-points
const SZ_TIT  = 24;       // 12pt em half-points
const SZ_CP   = 20;       // 10pt para artigos CP (itálico, não compactado)
const MARGIN_V = 851;     // 1,5cm em twips
const MARGIN_H = 1134;    // 2cm em twips
const LINE    = 276;      // entrelinha 1.15
const SP      = 80;       // 4pt
const SP_NONE = 0;
const SP_SM   = 40;       // 2pt

// A4 com margens 2cm laterais: 11906 - 1134 - 1134 = 9638 twips
const TABLE_W  = 9638;
const COL_NOME = 6800;  // ~70%
const COL_CPF  = 2838;  // ~30%
const COL_QUAL = 4819;  // 50% cada (qualidade — 2 colunas iguais)

const r   = (text, extra = {}) => new TextRun({ text, font: FONT, size: SZ, ...extra });
const rb  = (text, sz = SZ)    => new TextRun({ text, font: FONT, size: sz, bold: true });
const ri  = (text, sz = SZ_CP, extra = {}) => new TextRun({ text, font: FONT, size: sz, italics: true, ...extra });

const spacing = (before = SP, after = SP) => ({ before, after, line: LINE, lineRule: 'auto' });

// ── Bordas visíveis (tabelas de conteúdo) ────────────────────────────────────
const SOLID = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
const CELL_SOLID = { top: SOLID, bottom: SOLID, left: SOLID, right: SOLID };

// ── Bordas invisíveis (tabela de qualidade — visual clean) ───────────────────
const NO_BORDER   = { style: BorderStyle.NIL, size: 0, color: 'FFFFFF' };
const CELL_NONE   = { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER };

const p = (runs, spBefore = SP, spAfter = SP) => new Paragraph({
  children: Array.isArray(runs) ? runs : [r(runs)],
  spacing: spacing(spBefore, spAfter),
  alignment: AlignmentType.JUSTIFIED,
});
const pC = (runs, spBefore = SP, spAfter = SP, underline = false) => new Paragraph({
  children: Array.isArray(runs) ? runs : [new TextRun({
    text: typeof runs === 'string' ? runs : '',
    font: FONT, size: SZ_TIT, bold: true,
    underline: underline ? { type: UnderlineType.SINGLE } : undefined,
  })],
  spacing: spacing(spBefore, spAfter),
  alignment: AlignmentType.CENTER,
});
const pL = (runs, spBefore = SP_NONE, spAfter = SP_NONE) => new Paragraph({
  children: Array.isArray(runs) ? runs : [r(runs)],
  spacing: spacing(spBefore, spAfter),
  alignment: AlignmentType.LEFT,
});
const pTag = (tag) => new Paragraph({
  children: [new TextRun({ text: tag, font: FONT, size: SZ })],
  spacing: spacing(SP_NONE, SP_NONE),
  alignment: AlignmentType.LEFT,
});

// ── Tabela de beneficiários (loop docxtemplater, bordas visíveis) ─────────────
// {#loop} no primeiro cell, {/loop} no último — docxtemplater repete a row.
function tabelaBeneficiarios() {
  const makeHeaderRow = () => new TableRow({
    children: [
      new TableCell({
        columnSpan: 2,
        borders: CELL_SOLID,
        children: [new Paragraph({
          children: [rb('Beneficiários:', SZ)],
          alignment: AlignmentType.CENTER,
          spacing: spacing(SP_SM, SP_SM),
        })],
      }),
    ],
  });

  const makeDataRow = () => new TableRow({
    children: [
      new TableCell({
        width: { size: COL_NOME, type: WidthType.DXA },
        borders: CELL_SOLID,
        children: [new Paragraph({
          children: [
            r('{#representacao_legal.beneficiarios_representados}Nome: '),
            r('{.nome}'),
          ],
          spacing: spacing(SP_SM, SP_SM),
          alignment: AlignmentType.LEFT,
        })],
      }),
      new TableCell({
        width: { size: COL_CPF, type: WidthType.DXA },
        borders: CELL_SOLID,
        children: [new Paragraph({
          children: [
            r('CPF: {.cpf}'),
            r('{/representacao_legal.beneficiarios_representados}'),
          ],
          spacing: spacing(SP_SM, SP_SM),
          alignment: AlignmentType.LEFT,
        })],
      }),
    ],
  });

  return new Table({
    width: { size: TABLE_W, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    rows: [makeHeaderRow(), makeDataRow()],
  });
}

// ── Tabela de qualidade da representação (2 colunas, sem bordas visíveis) ─────
function tabelaQualidade() {
  const makeRow = (esqTag, esqLabel, dirTag, dirLabel) => new TableRow({
    children: [
      new TableCell({
        width: { size: COL_QUAL, type: WidthType.DXA },
        borders: CELL_NONE,
        children: [new Paragraph({
          children: [r(esqTag + ' '), r(esqLabel)],
          spacing: spacing(SP_SM, SP_SM),
          alignment: AlignmentType.LEFT,
        })],
      }),
      new TableCell({
        width: { size: COL_QUAL, type: WidthType.DXA },
        borders: CELL_NONE,
        children: [new Paragraph({
          children: [r(dirTag + ' '), r(dirLabel)],
          spacing: spacing(SP_SM, SP_SM),
          alignment: AlignmentType.LEFT,
        })],
      }),
    ],
  });

  const headerRow = new TableRow({
    children: [
      new TableCell({
        columnSpan: 2,
        borders: CELL_NONE,
        children: [new Paragraph({
          children: [rb('Qualidade da representação:', SZ)],
          alignment: AlignmentType.CENTER,
          spacing: spacing(SP_SM, SP_SM),
        })],
      }),
    ],
  });

  return new Table({
    width: { size: TABLE_W, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    rows: [
      headerRow,
      makeRow(
        '{checkbox_qualidade_representacao.tutor_nato}',   'Tutor Nato',
        '{checkbox_qualidade_representacao.tutor_legal}',  'Tutor Legal',
      ),
      makeRow(
        '{checkbox_qualidade_representacao.curador}',              'Curador',
        '{checkbox_qualidade_representacao.responsavel_termo_guarda}', 'Responsável Termo de Guarda',
      ),
      makeRow(
        '{checkbox_qualidade_representacao.administrador_provisorio}', 'Administrador Provisório',
        '{checkbox_qualidade_representacao.procurador}',               'Procurador',
      ),
    ],
  });
}

// ── Documento ─────────────────────────────────────────────────────────────────

const doc = new Document({
  sections: [{
    properties: {
      page: { margin: { top: MARGIN_V, bottom: MARGIN_V, left: MARGIN_H, right: MARGIN_H } },
    },
    children: [

      // ── Cabeçalho ────────────────────────────────────────────────────────
      pC([rb('INSTITUTO NACIONAL DO SEGURO SOCIAL', SZ_TIT)], SP_NONE, SP_NONE),
      pC('TERMO DE RESPONSABILIDADE', SP, SP * 2, true /* underline */),

      // ── Parágrafo 1 — identificação + compromisso ─────────────────────────
      // Texto fiel ao PDF de referência (TERMO DE RESPONSABILIDADE - PADRAO.pdf)
      p([
        r('Eu, '), rb('{representacao_legal.representante_nome}'),
        r(', inscrito no Cadastro de Pessoas Físicas (CPF) sob nº '),
        r('{representacao_legal.representante_cpf}'),
        r(', pelo presente Termo de Responsabilidade, exercendo a representação indicada abaixo, comprometo-me a comunicar ao INSS qualquer evento que possa anular a representação do(s) beneficiário(s) relacionado(s) a seguir, no prazo de 30 (trinta) dias, a contar da data em que o evento ocorra. Os eventos a comunicar são: óbito do titular/dependente do benefício ou cessação da representação legal.'),
      ], SP, SP),

      // ── Parágrafo 2 — ciência das penalidades ────────────────────────────
      // Texto fiel ao PDF de referência
      p('Estou ciente de que o descumprimento do compromisso ora assumido, além da obrigação à devolução de importâncias recebidas indevidamente, quando for o caso, estarei sujeito às penalidades previstas nos artigos 171 e 299 do Código Penal.', SP, SP),

      // ── Art. 171 — Estelionato ────────────────────────────────────────────
      // Texto oficial: Decreto-Lei 2.848/1940 (verificado planalto.gov.br, 2026-05-15)
      // Separador: hífen (-); verbo: "mantendo"; vírgula após "ardil,"
      p([
        ri('Art. 171 - Obter, para si ou para outrem, vantagem ilícita, em prejuízo alheio, induzindo ou '),
        ri('mantendo', SZ_CP, { bold: true }),
        ri(' alguém em erro, mediante artifício, ardil, ou qualquer outro meio fraudulento.'),
      ], SP, SP_SM),

      // ── Art. 299 — Falsidade Ideológica + pena ────────────────────────────
      // Texto oficial com parágrafo da pena (conforme PDF de referência e CP original)
      // Separador: travessão (–)
      p([
        ri('Art. 299 – Omitir, em documento público ou particular, declaração que devia constar, ou nele inserir ou fazer inserir declaração falsa ou diversa da que devia ser escrita, com o fim de prejudicar direito, criar, obrigação ou alterar a verdade sobre fato juridicamente relevante. '),
        ri('Pena - reclusão, de um a cinco anos, e multa, se o documento é público, e reclusão de um a três anos, e multa, se o documento é particular.'),
      ], SP_SM, SP),

      // ── Tabela de beneficiários ───────────────────────────────────────────
      tabelaBeneficiarios(),

      // ── Tabela de qualidade da representação ─────────────────────────────
      new Paragraph({ text: '', spacing: spacing(SP, SP_NONE) }),
      tabelaQualidade(),

      // ── Local, Data e Assinatura ─────────────────────────────────────────
      p([
        rb('Local e Data: ', SZ), r('{doc.cidade_assinatura}, '),
        r('{doc.dia_assinatura}/{doc.mes_assinatura_numero}/{doc.ano_assinatura}'),
      ], SP * 3, SP),
      pL([rb('Assinatura: ', SZ), r('{representacao_legal.representante_nome}')], SP, SP_NONE),

    ],
  }],
});

// ── Pós-processamento: corrige bordas de tabelas no XML ───────────────────────
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
    '<w:tblGrid><w:gridCol w:w="6800"/><w:gridCol w:w="2838"/></w:tblGrid>');
  xml = xml.replace(/<w:tblW[^>]*>/g, `<w:tblW w:type="dxa" w:w="${TABLE_W}"/>`);
  zip.file('word/document.xml', xml);
  return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
}

const buf = fixDocx(await Packer.toBuffer(doc));
writeFileSync(OUT, buf);
console.log('✓ Gerado:', OUT);

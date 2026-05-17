/**
 * Gera 10_declaracao_residencia.docx
 * Execute: node scripts/generate-declaracao-residencia.mjs
 *
 * Declaração de Residência — gerada quando o gatilho "imóvel de terceiro" está ativo.
 * Usa tags docxtemplater para substituição dinâmica.
 */

import { Document, Paragraph, TextRun, AlignmentType, Packer } from 'docx';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../templates/10_declaracao_residencia.docx');

const FONT   = 'Arial';
const SZ     = 28;   // 14pt em half-points
const SZ_TIT = 28;
const MARGIN_V = 851;  // 1,5cm
const MARGIN_H = 1134; // 2cm
const LINE   = 276;    // entrelinha 1.15
const SP     = 80;     // 4pt
const SP_NONE = 0;

const spacing = (before = SP, after = SP) => ({ before, after, line: LINE, lineRule: 'auto' });

const r  = (text, extra = {}) => new TextRun({ text, font: FONT, size: SZ, ...extra });
const rb = (text)              => new TextRun({ text, font: FONT, size: SZ, bold: true });

const pC = (children, before = SP, after = SP) => new Paragraph({
  children: Array.isArray(children) ? children : [r(children)],
  alignment: AlignmentType.CENTER,
  spacing: spacing(before, after),
});

const p = (children, before = SP, after = SP) => new Paragraph({
  children: Array.isArray(children) ? children : [r(children)],
  alignment: AlignmentType.JUSTIFIED,
  spacing: spacing(before, after),
});

const pL = (children, before = SP, after = SP) => new Paragraph({
  children: Array.isArray(children) ? children : [r(children)],
  alignment: AlignmentType.LEFT,
  spacing: spacing(before, after),
});

// ── Endereço formatado (usado em ambos os blocos) ─────────────────────────────
const ENDERECO = '{endereco.logradouro}, {endereco.numero}{endereco.complemento_formatado}'
  + ' – Bairro: {endereco.bairro}'
  + ' – {endereco.cidade} – {endereco.uf}'
  + ' – CEP: {endereco.cep}';

const doc = new Document({
  sections: [{
    properties: {
      page: {
        margin: { top: MARGIN_V, bottom: MARGIN_V, left: MARGIN_H, right: MARGIN_H },
      },
    },
    children: [

      // ── Título ───────────────────────────────────────────────────────────────
      pC([rb('DECLARAÇÃO DE RESIDÊNCIA')], SP_NONE, SP * 2),

      // ── Qualificação do declarante ────────────────────────────────────────────
      p([
        r('Eu, '), rb('{cliente.nome_completo}'),
        r(', {cliente.nacionalidade}, {cliente.estado_civil}, filho(a) de {cliente.nome_mae},'
          + ' nascido(a) em {cliente.data_nascimento},'
          + ' portador(a) da cédula de identidade R.G. Nº {cliente.rg},'
          + ' inscrito(a) no CPF: {cliente.cpf},'),
      ], SP, SP),

      // ── Declaração — mora sozinho ─────────────────────────────────────────────
      // {#bloco_mora_sozinho} e {/bloco_mora_sozinho} inline na mesma parágrafo
      // para que docxtemplater use lógica de bloco condicional inline
      p(
        '{#bloco_mora_sozinho}'
        + `DECLARO que resido no endereço ${ENDERECO}, em imóvel de {imovel.proprietario_nome}.`
        + '{/bloco_mora_sozinho}',
        SP, SP,
      ),

      // ── Declaração — mora com dependentes ────────────────────────────────────
      p(
        '{#bloco_mora_com_dependentes}'
        + 'DECLARO que resido com {dependentes[0].nome_completo},'
        + ' nascido(a) em {dependentes[0].data_nascimento}'
        + ' (CPF: {dependentes[0].cpf} e RG: {dependentes[0].rg}),'
        + ` no endereço ${ENDERECO}, em imóvel de {imovel.proprietario_nome}.`
        + '{/bloco_mora_com_dependentes}',
        SP, SP,
      ),

      // ── Cláusula de veracidade ────────────────────────────────────────────────
      p(
        'Declaro, ainda, que tenho conhecimento das sanções penais às quais estarei'
        + ' sujeito(a) em caso de fornecimento de informações e dados inverídicos.',
        SP, SP,
      ),

      p('Por ser verdade, firmo o presente.', SP, SP * 2),

      // ── Local e data ──────────────────────────────────────────────────────────
      pL(
        '{doc.cidade_assinatura}, {doc.dia_assinatura}'
        + ' de {doc.mes_assinatura_extenso}'
        + ' de {doc.ano_assinatura}.',
        SP_NONE, SP * 4,
      ),

      // ── Assinatura ───────────────────────────────────────────────────────────
      pL('_________________________________', SP_NONE, SP_NONE),
      pL([rb('{cliente.nome_completo}')], SP_NONE, SP_NONE),

    ],
  }],
});

const buf = await Packer.toBuffer(doc);
writeFileSync(OUT, buf);
console.log('✓ Gerado:', OUT);

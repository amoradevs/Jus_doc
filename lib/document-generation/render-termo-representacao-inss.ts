import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import type { TemplateContext } from './template-context';

// ── Constantes de layout (A4) ───────────────────────────────────────────────
const PW = 595;
const PH = 842;
const ML = 57;
const MR = 57;
const BW = PW - ML - MR; // 481 pt
const FS = 10;
const FS_SM = 7.5;
const LH = 14;

// ── Utilitários de desenho ───────────────────────────────────────────────────

function tw(text: string, font: PDFFont, size: number) {
  return font.widthOfTextAtSize(text, size);
}

function centered(page: PDFPage, text: string, y: number, font: PDFFont, size: number) {
  page.drawText(text, { x: (PW - tw(text, font, size)) / 2, y, size, font, color: rgb(0, 0, 0) });
}

function drawSegments(
  page: PDFPage, y: number, startX: number,
  segments: Array<{ text: string; font: PDFFont; size?: number }>,
) {
  let x = startX;
  for (const s of segments) {
    const sz = s.size ?? FS;
    page.drawText(s.text, { x, y, size: sz, font: s.font, color: rgb(0, 0, 0) });
    x += tw(s.text, s.font, sz);
  }
}

function drawWrapped(
  page: PDFPage, text: string, x: number, startY: number,
  maxW: number, font: PDFFont, size: number, lh: number,
): number {
  const words = text.split(' ');
  let line = '';
  let y = startY;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (tw(test, font, size) > maxW && line) {
      page.drawText(line, { x, y, size, font, color: rgb(0, 0, 0) });
      y -= lh;
      line = word;
    } else {
      line = test;
    }
  }
  if (line) {
    page.drawText(line, { x, y, size, font, color: rgb(0, 0, 0) });
    y -= lh;
  }
  return y;
}

function drawCheckbox(page: PDFPage, x: number, y: number, checked: boolean, font: PDFFont) {
  const b = FS;
  page.drawRectangle({
    x, y: y - 1, width: b, height: b,
    borderColor: rgb(0, 0, 0), borderWidth: 0.5, color: rgb(1, 1, 1),
  });
  if (checked) {
    page.drawText('x', { x: x + 1.5, y: y + 0.5, size: FS - 2, font, color: rgb(0, 0, 0) });
  }
}

function isChecked(val: string | undefined) {
  return val === 'X' || val === 'x';
}

// ── Gerador principal ────────────────────────────────────────────────────────

export async function renderTermoRepresentacaoInss(ctx: TemplateContext): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([PW, PH]);
  const fn = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fb = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  const { cliente: cl, endereco: en, escritorio: wr, doc: dc, checkbox_X: cx } = ctx;

  const cidadeUf = `${en.cidade} (${en.uf})`;
  const endFull = [en.logradouro, en.numero]
    .filter(Boolean).join(', ')
    + (en.complemento_formatado ? en.complemento_formatado : '')
    + (en.bairro ? `, ${en.bairro}` : '');
  const dataStr = `${dc.dia_assinatura}/${dc.mes_assinatura_numero}/${dc.ano_assinatura}`;

  // ── Logo INSS ──────────────────────────────────────────────────────────────
  const logoPath = path.resolve(process.cwd(), 'templates/inss-logo.png');
  if (fs.existsSync(logoPath)) {
    const img = await pdfDoc.embedPng(fs.readFileSync(logoPath));
    const d = img.scaleToFit(160, 55);
    page.drawImage(img, { x: (PW - d.width) / 2, y: PH - 14 - d.height, width: d.width, height: d.height });
  }

  // ── Cabeçalho ──────────────────────────────────────────────────────────────
  // y=760 deixa ~13pt de espaço abaixo do logo (logo bottom em ~773)
  let y = PH - 82;
  centered(page, 'INSTITUTO NACIONAL DO SEGURO SOCIAL', y, fb, FS);
  y -= LH;
  centered(page, 'TERMO DE REPRESENTAÇÃO E AUTORIZAÇÃO DE ACESSO A INFORMAÇÕES', y, fb, FS);
  y -= LH;
  centered(page, 'PREVIDENCIÁRIAS', y, fb, FS);
  y -= LH * 2;

  // ── Corpo do formulário ────────────────────────────────────────────────────
  const x = ML;

  drawSegments(page, y, x, [
    { text: 'Eu, ', font: fn },
    { text: cl.nome_completo, font: fn },
    { text: ', inscrito (a) no', font: fn },
  ]);
  y -= LH;

  drawSegments(page, y, x, [
    { text: 'CPF nº ', font: fn },
    { text: cl.cpf, font: fn },
    { text: ', RG nº ', font: fn },
    { text: cl.rg || '', font: fn },
    { text: ', residente e domiciliado (a) em,', font: fn },
  ]);
  y -= LH;

  y = drawWrapped(page, endFull + ',', x, y, BW, fn, FS, LH);

  drawSegments(page, y, x, [
    { text: 'no Município de ', font: fn },
    { text: cidadeUf, font: fn },
    { text: ', CEP ', font: fn },
    { text: en.cep, font: fn },
    { text: ', representado pelo', font: fn },
  ]);
  y -= LH;

  drawSegments(page, y, x, [
    { text: 'advogado ', font: fn },
    { text: wr.adv1_nome, font: fn },
    { text: ',', font: fn },
  ]);
  y -= LH;

  drawSegments(page, y, x, [
    { text: 'CPF nº ', font: fn },
    { text: wr.adv1_cpf, font: fn },
    { text: ', OAB Nº ', font: fn },
    { text: wr.adv1_oab, font: fn },
    { text: ', NIT nº ', font: fn },
    { text: cl.nit || '', font: fn },
    { text: ', CONFIRO PODERES', font: fn },
  ]);
  y -= LH;

  y = drawWrapped(page,
    'ESPECÍFICOS para me representar perante o INSS na solicitação do serviço ou benefício abaixo indicado e AUTORIZO o (a) referido (a) profissional a ter acesso apenas às informações pessoais necessárias a subsidiar o requerimento eletrônico do serviço ou benefício abaixo elencado:',
    x, y, BW, fn, FS, LH,
  );
  y -= 4;

  // ── Tabela de checkboxes ───────────────────────────────────────────────────
  const ROW_H = 16;
  const rows = [
    { num: 'I.',    label: 'Aposentadoria por Idade',             key: 'aposentadoria_idade',   sub: [{ label: 'urbana', key: 'aposentadoria_idade_urbana' }, { label: 'rural', key: 'aposentadoria_idade_rural' }] },
    { num: 'II.',   label: 'Aposentadoria por Tempo de Contribuição', key: 'aposentadoria_tempo' },
    { num: 'III.',  label: 'Aposentadoria Especial',              key: 'aposentadoria_especial' },
    { num: 'IV.',   label: 'Pensão por Morte Previdenciária',     key: 'pensao_morte',           sub: [{ label: 'urbana', key: 'pensao_morte_urbana' }, { label: 'rural', key: 'pensao_morte_rural' }] },
    { num: 'V.',    label: 'Auxílio-Reclusão',                   key: 'auxilio_reclusao',        sub: [{ label: 'urbano', key: 'auxilio_reclusao_urbano' }, { label: 'rural', key: 'auxilio_reclusao_rural' }] },
    { num: 'VI.',   label: 'Salário Maternidade',                 key: 'salario_maternidade',    sub: [{ label: 'urbano', key: 'salario_maternidade_urbano' }, { label: 'rural', key: 'salario_maternidade_rural' }] },
    { num: 'VII.',  label: 'Atualização Cadastral',               key: 'atualizacao_cadastral' },
    { num: 'VIII.', label: 'Benefício de Prestação Continuada – BPC/LOAS', key: 'bpc' },
  ];

  const tableH = ROW_H * rows.length + 2;
  const tableBot = y - tableH;

  page.drawRectangle({
    x, y: tableBot, width: BW, height: tableH,
    borderColor: rgb(0, 0, 0), borderWidth: 0.75, color: rgb(1, 1, 1),
  });

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowY = y - i * ROW_H - ROW_H / 2 - FS / 2 + 1;

    if (i > 0) {
      const sepY = y - i * ROW_H;
      page.drawLine({ start: { x, y: sepY }, end: { x: x + BW, y: sepY }, thickness: 0.3, color: rgb(0.6, 0.6, 0.6) });
    }

    let rx = x + 6;
    page.drawText(row.num, { x: rx, y: rowY, size: FS, font: fn, color: rgb(0, 0, 0) });
    rx += 28;

    drawCheckbox(page, rx, rowY, isChecked(cx[row.key]), fn);
    rx += FS + 4;

    page.drawText(row.label, { x: rx, y: rowY, size: FS, font: fn, color: rgb(0, 0, 0) });
    rx += tw(row.label, fn, FS) + 8;

    if ('sub' in row && row.sub) {
      for (const sub of row.sub) {
        drawCheckbox(page, rx, rowY, isChecked(cx[sub.key]), fn);
        rx += FS + 3;
        page.drawText(sub.label, { x: rx, y: rowY, size: FS, font: fn, color: rgb(0, 0, 0) });
        rx += tw(sub.label, fn, FS) + 6;
      }
    }
  }

  y = tableBot - LH;

  // ── Parágrafo "Podendo" ────────────────────────────────────────────────────
  y = drawWrapped(page,
    'Podendo, para tanto, praticar os atos necessários ao cumprimento deste mandato, em especial, prestar informações, acompanhar requerimentos, cumprir exigências, ter vistas e tomar ciência de decisões sobre processos de requerimento de benefícios operacionalizados pelo Instituto.',
    x, y, BW, fn, FS, LH,
  );
  y -= LH;

  // ── Assinatura Representado ────────────────────────────────────────────────
  page.drawText(`${cidadeUf}, ${dataStr}.`, { x, y, size: FS, font: fn, color: rgb(0, 0, 0) });
  const sig1X = x + BW - 155;
  page.drawLine({ start: { x: sig1X, y }, end: { x: x + BW, y }, thickness: 0.5, color: rgb(0, 0, 0) });
  y -= 5;
  const lbl1 = 'Assinatura do (a) Representado (a)';
  page.drawText(lbl1, { x: sig1X + (155 - tw(lbl1, fn, FS_SM)) / 2, y, size: FS_SM, font: fn, color: rgb(0, 0, 0) });
  y -= LH * 2;

  // ── TERMO DE RESPONSABILIDADE ─────────────────────────────────────────────
  centered(page, 'TERMO DE RESPONSABILIDADE', y, fb, FS);
  y -= LH * 1.5;

  y = drawWrapped(page,
    'Por este Termo de Responsabilidade, comprometo-me a comunicar ao INSS qualquer evento que possa anular esta Procuração, no prazo de trinta dias, a contar da data que o mesmo ocorra, principalmente o óbito do segurado / pensionista, mediante apresentação da respectiva certidão.',
    x, y, BW, fn, FS, LH,
  );
  y -= LH * 0.5;

  y = drawWrapped(page,
    'Estou ciente de que o descumprimento do compromisso ora assumido, além de obrigar a devolução de importâncias recebidas indevidamente, quando for o caso, sujeitar-me-á às penalidades previstas nos arts. 171 e 299, ambos do Código Penal.',
    x, y, BW, fn, FS, LH,
  );
  y -= LH;

  // ── Assinatura Procurador ──────────────────────────────────────────────────
  page.drawText(`${cidadeUf}, ${dataStr}.`, { x, y, size: FS, font: fn, color: rgb(0, 0, 0) });
  const sig2X = x + BW - 155;
  page.drawLine({ start: { x: sig2X, y }, end: { x: x + BW, y }, thickness: 0.5, color: rgb(0, 0, 0) });
  y -= 5;
  const lbl2 = 'Assinatura do (a) Procurador (a)';
  page.drawText(lbl2, { x: sig2X + (155 - tw(lbl2, fn, FS_SM)) / 2, y, size: FS_SM, font: fn, color: rgb(0, 0, 0) });
  y -= LH * 2;

  // ── Código Penal ───────────────────────────────────────────────────────────
  page.drawText('CÓDIGO PENAL', { x, y, size: FS_SM, font: fb, color: rgb(0, 0, 0) });
  y -= LH * 0.9;

  y = drawWrapped(page,
    'Art. 171. Obter, para si ou para outrem, vantagem ilícita, em prejuízo alheio, induzindo ou manter alguém em erro, mediante artifício, ardil ou qualquer outro meio fraudulento.',
    x, y, BW, fn, FS_SM, LH * 0.9,
  );

  drawWrapped(page,
    'Art. 299. Omitir, em documento público ou particular, declaração que devia constar, ou nele inserir ou fazer inserir declaração falsa ou diversa da que devia ser escrita, com o fim de prejudicar direito, criar, obrigação ou alterar a verdade sobre fato juridicamente relevante.',
    x, y, BW, fn, FS_SM, LH * 0.9,
  );

  return Buffer.from(await pdfDoc.save());
}

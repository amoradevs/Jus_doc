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

function drawJustified(
  page: PDFPage, text: string, x: number, startY: number,
  maxW: number, font: PDFFont, size: number, lh: number,
): number {
  const words = text.split(' ');
  const lines: string[][] = [];
  let current: string[] = [];
  for (const word of words) {
    const test = [...current, word].join(' ');
    if (tw(test, font, size) > maxW && current.length > 0) {
      lines.push(current);
      current = [word];
    } else {
      current.push(word);
    }
  }
  if (current.length > 0) lines.push(current);

  let y = startY;
  for (let i = 0; i < lines.length; i++) {
    const lineWords = lines[i];
    const isLast = i === lines.length - 1;
    if (isLast || lineWords.length === 1) {
      page.drawText(lineWords.join(' '), { x, y, size, font, color: rgb(0, 0, 0) });
    } else {
      const totalW = lineWords.reduce((s, w) => s + tw(w, font, size), 0);
      const gap = (maxW - totalW) / (lineWords.length - 1);
      let cx = x;
      for (const word of lineWords) {
        page.drawText(word, { x: cx, y, size, font, color: rgb(0, 0, 0) });
        cx += tw(word, font, size) + gap;
      }
    }
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
  const logoPath = path.resolve(process.cwd(), 'templates/brasao-republica.png');
  if (fs.existsSync(logoPath)) {
    const img = await pdfDoc.embedPng(fs.readFileSync(logoPath));
    const d = img.scaleToFit(60, 60);
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

  // Bloco de identificação: parágrafo único contínuo, igual ao formulário oficial do INSS.
  const identificacao =
    `Eu, ${cl.nome_completo}, inscrito(a) no CPF nº ${cl.cpf}, RG nº ${cl.rg || ''}, ` +
    `residente e domiciliado(a) em, ${endFull}, no Município de ${en.cidade}/${en.uf}, ` +
    `CEP ${en.cep}, representado pela advogada ${wr.adv1_nome}, CPF nº ${wr.adv1_cpf}, ` +
    `OAB Nº ${wr.adv1_oab}, NIT nº ${cl.nit || ''}, CONFIRO PODERES ESPECÍFICOS para me ` +
    `representar perante o INSS na solicitação do serviço ou benefício abaixo indicado e ` +
    `AUTORIZO o(a) referido(a) profissional a ter acesso apenas às informações pessoais ` +
    `necessárias a subsidiar o requerimento eletrônico do serviço ou benefício abaixo elencado:`;

  y = drawJustified(page, identificacao, x, y, BW, fn, FS, LH);
  y -= 4;

  // ── Tabela de checkboxes ───────────────────────────────────────────────────
  const ROW_H = 16;
  const rows = [
    { num: 'I.',    label: 'Aposentadoria por Idade',             key: 'aposentadoria_idade',   sub: [{ label: 'urbana', key: 'aposentadoria_idade_urbana' }, { label: 'rural', key: 'aposentadoria_idade_rural' }] },
    { num: 'II.',   label: 'Aposentadoria por Tempo de Contribuição', key: 'aposentadoria_tempo' },
    { num: 'III.',  label: 'Aposentadoria Especial',              key: 'aposentadoria_especial' },
    { num: 'IV.',   label: 'Pensão por Morte Previdenciária',     key: 'pensao_morte',           sub: [{ label: 'urbana', key: 'pensao_morte_urbana' }, { label: 'rural', key: 'pensao_morte_rural' }] },
    { num: 'V.',    label: 'Auxílio-Reclusão',                   key: 'auxilio_reclusao',        sub: [{ label: 'urbano', key: 'auxilio_reclusao_urbano' }, { label: 'rural', key: 'auxilio_reclusao_rural' }] },
    { num: 'VI.',   label: 'Salário-Maternidade',                 key: 'salario_maternidade',    sub: [{ label: 'urbano', key: 'salario_maternidade_urbano' }, { label: 'rural', key: 'salario_maternidade_rural' }] },
    { num: 'VII.',  label: 'Benefício de Prestação Continuada – BPC/LOAS', key: 'bpc' },
    { num: 'VIII.', label: 'Atualização Cadastral',               key: 'atualizacao_cadastral' },
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
  y = drawJustified(page,
    'Podendo, para tanto, praticar os atos necessários ao cumprimento deste mandato, em especial, prestar informações, acompanhar requerimentos, cumprir exigências, ter vistas e tomar ciência de decisões sobre processos de requerimento de benefícios operacionalizados pelo Instituto.',
    x, y, BW, fn, FS, LH,
  );
  y -= LH;

  // ── Assinatura Representado ────────────────────────────────────────────────
  page.drawText(`${cidadeUf}, ${dataStr}.`, { x, y, size: FS, font: fn, color: rgb(0, 0, 0) });
  const sig1X = x + BW - 155;
  page.drawLine({ start: { x: sig1X, y }, end: { x: x + BW, y }, thickness: 0.5, color: rgb(0, 0, 0) });
  y -= LH * 0.8;

  const lbl1 = ctx.bloco_assinatura_a_rogo
    ? `${cl.nome_completo}`
    : 'Assinatura do (a) Representado (a)';
  page.drawText(lbl1, { x: sig1X + (155 - tw(lbl1, fn, FS_SM)) / 2, y, size: FS_SM, font: fn, color: rgb(0, 0, 0) });
  y -= LH * 0.9;

  if (ctx.bloco_assinatura_a_rogo && ctx.testemunhas.length >= 2) {
    if (ctx.validador.nome_completo) {
      const v = ctx.validador;
      const rogoALine = `A ROGO: ${v.nome_completo}`;
      page.drawText(rogoALine, { x: sig1X + (155 - tw(rogoALine, fn, FS_SM)) / 2, y, size: FS_SM, font: fn, color: rgb(0, 0, 0) });
      y -= LH * 0.95;
      if (v.rg) {
        const rgLine = `RG: ${v.rg}`;
        page.drawText(rgLine, { x: sig1X + (155 - tw(rgLine, fn, FS_SM)) / 2, y, size: FS_SM, font: fn, color: rgb(0, 0, 0) });
        y -= LH * 0.95;
      }
      const cpfLine = `CPF: ${v.cpf}`;
      page.drawText(cpfLine, { x: sig1X + (155 - tw(cpfLine, fn, FS_SM)) / 2, y, size: FS_SM, font: fn, color: rgb(0, 0, 0) });
      y -= LH * 1.4;
    } else {
      y -= LH * 0.5;
    }

    const colW = (BW - 20) / 2;
    const col1X = x;
    const col2X = x + colW + 20;
    y -= LH * 3.0;

    for (const cx of [col1X, col2X]) {
      page.drawLine({ start: { x: cx, y }, end: { x: cx + colW - 10, y }, thickness: 0.5, color: rgb(0, 0, 0) });
    }
    y -= LH * 0.8;

    const t1 = ctx.testemunhas[0];
    const t2 = ctx.testemunhas[1];

    page.drawText(t1.nome_completo, { x: col1X, y, size: FS_SM, font: fn, color: rgb(0, 0, 0) });
    page.drawText(t2.nome_completo, { x: col2X, y, size: FS_SM, font: fn, color: rgb(0, 0, 0) });
    y -= LH * 0.95;

    if (t1.rg) { page.drawText(`RG: ${t1.rg}`, { x: col1X, y, size: FS_SM, font: fn, color: rgb(0, 0, 0) }); }
    if (t2.rg) { page.drawText(`RG: ${t2.rg}`, { x: col2X, y, size: FS_SM, font: fn, color: rgb(0, 0, 0) }); }
    y -= LH * 0.95;

    page.drawText(`CPF: ${t1.cpf}`, { x: col1X, y, size: FS_SM, font: fn, color: rgb(0, 0, 0) });
    page.drawText(`CPF: ${t2.cpf}`, { x: col2X, y, size: FS_SM, font: fn, color: rgb(0, 0, 0) });
    y -= LH * 0.95;

    page.drawText(`Nasc.: ${t1.data_nascimento}`, { x: col1X, y, size: FS_SM, font: fn, color: rgb(0, 0, 0) });
    page.drawText(`Nasc.: ${t2.data_nascimento}`, { x: col2X, y, size: FS_SM, font: fn, color: rgb(0, 0, 0) });
    y -= LH * 0.95;
    y -= LH * 0.5;
  } else {
    if (ctx.bloco_assinatura_menor) {
      const { parentesco, nome_completo: repNome } = ctx.representante;
      if (parentesco && repNome) {
        const repLine = `${parentesco}: ${repNome}`;
        page.drawText(repLine, { x: sig1X + (155 - tw(repLine, fn, FS_SM)) / 2, y, size: FS_SM, font: fn, color: rgb(0, 0, 0) });
        y -= LH * 0.95;
      }
    }
    y -= LH * 2;
  }

  // ── TERMO DE RESPONSABILIDADE ─────────────────────────────────────────────
  centered(page, 'TERMO DE RESPONSABILIDADE', y, fb, FS);
  y -= LH * 1.5;

  y = drawJustified(page,
    'Por este Termo de Responsabilidade, comprometo-me a comunicar ao INSS qualquer evento que possa anular esta Procuração, no prazo de trinta dias, a contar da data que o mesmo ocorra, principalmente o óbito do segurado / pensionista, mediante apresentação da respectiva certidão. Estou ciente de que o descumprimento do compromisso ora assumido, além de obrigar a devolução de importâncias recebidas indevidamente, quando for o caso, sujeitar-me-á às penalidades previstas nos arts. 171 e 299, ambos do Código Penal.',
    x, y, BW, fn, FS, LH,
  );
  y -= LH;

  // ── Assinatura Procurador (imagem + nome + OAB da advogada) ──────────────
  page.drawText(`${cidadeUf}, ${dataStr}.`, { x, y, size: FS, font: fn, color: rgb(0, 0, 0) });
  const sig2X = x + BW - 155;

  // Desenha imagem da assinatura acima da linha, se disponível
  if (ctx.incluir_assinatura_lidiane) {
    const sigImgPath = path.resolve(process.cwd(), ctx.escritorio.adv1_assinatura_path);
    if (fs.existsSync(sigImgPath)) {
      const sigImg = await pdfDoc.embedPng(fs.readFileSync(sigImgPath));
      const sd = sigImg.scaleToFit(120, 28);
      page.drawImage(sigImg, {
        x: sig2X + (155 - sd.width) / 2,
        y,
        width: sd.width,
        height: sd.height,
      });
    }
  }

  page.drawLine({ start: { x: sig2X, y }, end: { x: x + BW, y }, thickness: 0.5, color: rgb(0, 0, 0) });
  y -= LH * 0.9;
  page.drawText(wr.adv1_nome, { x: sig2X + (155 - tw(wr.adv1_nome, fn, FS_SM)) / 2, y, size: FS_SM, font: fn, color: rgb(0, 0, 0) });
  y -= LH * 0.85;
  const oabStr = `OAB ${wr.adv1_oab}`;
  page.drawText(oabStr, { x: sig2X + (155 - tw(oabStr, fn, FS_SM)) / 2, y, size: FS_SM, font: fn, color: rgb(0, 0, 0) });
  y -= LH * 1.5;

  // ── Código Penal ───────────────────────────────────────────────────────────
  page.drawText('CÓDIGO PENAL', { x, y, size: FS_SM, font: fb, color: rgb(0, 0, 0) });
  y -= LH * 0.9;

  y = drawJustified(page,
    'Art. 171 - Obter, para si ou para outrem, vantagem ilícita, em prejuízo alheio, induzindo ou mantendo alguém em erro, mediante artifício, ardil, ou qualquer outro meio fraudulento.',
    x, y, BW, fn, FS_SM, LH * 0.9,
  );

  drawJustified(page,
    'Art. 299 – Omitir, em documento público ou particular, declaração que devia constar, ou nele inserir ou fazer inserir declaração falsa ou diversa da que devia ser escrita, com o fim de prejudicar direito, criar, obrigação ou alterar a verdade sobre fato juridicamente relevante.',
    x, y, BW, fn, FS_SM, LH * 0.9,
  );

  return Buffer.from(await pdfDoc.save());
}

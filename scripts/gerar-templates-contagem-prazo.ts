// Gera os dois templates DOCX para a funcionalidade de Contagem de Prazo.
// Execute com: npx tsx scripts/gerar-templates-contagem-prazo.ts

import PizZip from 'pizzip';
import * as fs from 'fs';
import * as path from 'path';

function criarDocxMinimo(xmlContent: string): Buffer {
  const zip = new PizZip();

  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`);

  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

  zip.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`);

  zip.file('word/styles.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:styleId="Normal" w:default="1">
    <w:name w:val="Normal"/>
    <w:rPr><w:sz w:val="24"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:rPr><w:b/><w:sz w:val="32"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:rPr><w:b/><w:sz w:val="28"/></w:rPr>
  </w:style>
</w:styles>`);

  zip.file('word/document.xml', xmlContent);

  return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' }) as Buffer;
}

function p(bold: boolean, text: string): string {
  const rPr = bold ? '<w:rPr><w:b/></w:rPr>' : '';
  return `<w:p><w:r>${rPr}<w:t xml:space="preserve">${text}</w:t></w:r></w:p>`;
}

function linha(label: string, placeholder: string): string {
  return `<w:p>
    <w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${label}: </w:t></w:r>
    <w:r><w:t xml:space="preserve">{${placeholder}}</w:t></w:r>
  </w:p>`;
}

function separador(): string {
  return `<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="4" w:space="1"/></w:pBdr></w:pPr></w:p>`;
}

function gerarPlanejamento(): Buffer {
  const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>

${p(true, 'PLANEJAMENTO PREVIDENCIÁRIO')}
${p(false, 'Lidiane Rocha Abreu — Advocacia Previdenciária')}
${separador()}

${p(true, 'DADOS DO SEGURADO')}
${linha('Nome', 'segurado_nome')}
${linha('CPF', 'segurado_cpf')}
${linha('Data de Nascimento', 'segurado_nascimento')}
${linha('Sexo', 'segurado_sexo')}
${linha('DER (Data de Entrada do Requerimento)', 'der_formatada')}
${linha('Data do Cálculo', 'data_calculo')}
${separador()}

${p(true, 'TEMPO DE CONTRIBUIÇÃO')}
${linha('Total contributivo', 'total_contributivo')}
${separador()}

${p(true, 'REGRAS DE APOSENTADORIA — EC 103/2019')}

${p(true, 'Art. 15 — Sistema de Pontos (Regra de Transição)')}
${linha('Elegível', 'art15_elegivel')}
${linha('Situação', 'art15_status')}
${linha('Data prevista', 'art15_data')}
${linha('Pontos na DER', 'art15_pontos_atuais')}
${linha('Pontos necessários na DER', 'art15_pontos_necessarios')}
${linha('Observação', 'art15_obs')}

${p(true, 'Art. 16 — Idade Progressiva (Regra de Transição)')}
${linha('Elegível', 'art16_elegivel')}
${linha('Situação', 'art16_status')}
${linha('Data prevista', 'art16_data')}
${linha('Idade necessária', 'art16_idade_necessaria')}
${linha('Observação', 'art16_obs')}

${p(true, 'Art. 17 — Pedágio 50% (Regra de Transição)')}
${linha('Elegível', 'art17_elegivel')}
${linha('Situação', 'art17_status')}
${linha('Data prevista', 'art17_data')}
${linha('Observação', 'art17_obs')}

${p(true, 'Art. 18 — Aposentadoria por Idade (Regra Permanente)')}
${linha('Situação', 'art18_status')}
${linha('Data prevista', 'art18_data')}
${linha('Observação', 'art18_obs')}

${p(true, 'Art. 20 — Pedágio 100% (Regra de Transição)')}
${linha('Elegível', 'art20_elegivel')}
${linha('Situação', 'art20_status')}
${linha('Data prevista', 'art20_data')}
${linha('Observação', 'art20_obs')}

${separador()}

${p(true, 'BENEFÍCIO ESTIMADO')}
${linha('Salário de Benefício', 'salario_beneficio')}
${linha('Coeficiente EC 103/2019', 'coeficiente_ec103')}
${linha('Benefício mensal estimado', 'beneficio_mensal')}
${linha('Teto do INSS', 'teto_inss')}
${separador()}

${p(false, '{data_extenso}')}
${p(false, '{escritorio_advogada}')}
${p(false, 'OAB {escritorio_oab}')}

<w:sectPr><w:pgSz w:w="12240" w:h="15840"/></w:sectPr>
</w:body>
</w:document>`;

  return criarDocxMinimo(xml);
}

function gerarEmailSegurado(): Buffer {
  const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>

${p(false, 'Prezado(a) {segurado_nome},')}
${p(false, '')}
${p(false, 'Conforme análise do seu CNIS e das regras da Reforma da Previdência (EC 103/2019), segue o resumo do seu planejamento previdenciário:')}
${p(false, '')}

${p(true, 'SEU TEMPO DE CONTRIBUIÇÃO')}
${p(false, 'Tempo total contributivo: {total_contributivo}')}
${p(false, '')}

${p(true, 'QUANDO VOCÊ PODE SE APOSENTAR')}

${p(false, '• Sistema de Pontos (Art. 15): {art15_status}')}
${p(false, '  {art15_obs}')}

${p(false, '• Idade Progressiva (Art. 16): {art16_status}')}
${p(false, '  {art16_obs}')}

${p(false, '• Pedágio 50% (Art. 17): {art17_status}')}
${p(false, '  {art17_obs}')}

${p(false, '• Aposentadoria por Idade (Art. 18): {art18_status}')}
${p(false, '  {art18_obs}')}

${p(false, '• Pedágio 100% (Art. 20): {art20_status}')}
${p(false, '  {art20_obs}')}

${p(false, '')}
${p(true, 'BENEFÍCIO ESTIMADO')}
${p(false, 'Salário de benefício: {salario_beneficio}')}
${p(false, 'Coeficiente EC 103/2019: {coeficiente_ec103}')}
${p(true, 'Benefício mensal estimado: {beneficio_mensal}')}

${p(false, '')}
${p(false, 'Este é um planejamento preliminar baseado nos dados informados. Os valores são estimativas e podem variar conforme atualização das tabelas do INSS.')}
${p(false, '')}
${p(false, 'Qualquer dúvida, estou à disposição.')}
${p(false, '')}
${p(false, 'Atenciosamente,')}
${p(false, '{escritorio_advogada}')}
${p(false, 'OAB {escritorio_oab}')}
${p(false, 'Advocacia Previdenciária')}

<w:sectPr><w:pgSz w:w="12240" w:h="15840"/></w:sectPr>
</w:body>
</w:document>`;

  return criarDocxMinimo(xml);
}

const templatesDir = path.resolve(process.cwd(), 'templates');

const bufPlanejamento = gerarPlanejamento();
fs.writeFileSync(path.join(templatesDir, 'planejamento_previdenciario.docx'), bufPlanejamento);
console.log('✓ planejamento_previdenciario.docx gerado');

const bufEmail = gerarEmailSegurado();
fs.writeFileSync(path.join(templatesDir, 'email_segurado.docx'), bufEmail);
console.log('✓ email_segurado.docx gerado');

console.log('\nTemplates criados em templates/');

import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const angularExpressions = require('angular-expressions');
const ImageModule = require('docxtemplater-image-module-free');
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

function angularParser(tag) {
  if (tag === '.') return { get: (s) => s };
  // tags {.prop} dentro de loops — acesso relativo ao item atual
  if (tag.startsWith('.')) {
    const prop = tag.slice(1);
    return { get: (scope) => scope?.[prop] ?? '' };
  }
  const expr = angularExpressions.compile(tag.replace(/('|')/g, "'").replace(/(")/g, '"'));
  return {
    get(scope, context) {
      let obj = {};
      for (let i = 0, len = context.num + 1; i < len; i++) obj = Object.assign(obj, context.scopeList[i]);
      return expr(scope, obj);
    },
  };
}

function makeImageModule() {
  return new ImageModule({
    centered: false,
    getImage: (tagValue) => {
      try { return fs.readFileSync(path.resolve(ROOT, tagValue)); } catch { return fs.readFileSync(path.join(ROOT, 'templates/assinaturas/lidiane.png')); }
    },
    getSize: () => [180, 50],
  });
}

function render(templateFile, ctx, outFile) {
  const buf = fs.readFileSync(path.join(ROOT, 'templates', templateFile));
  const zip = new PizZip(buf);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true, linebreaks: true, parser: angularParser,
    nullGetter() { return ''; }, modules: [makeImageModule()],
  });
  doc.render(ctx);
  const out = path.join(__dirname, 'output', outFile);
  fs.mkdirSync(path.join(__dirname, 'output'), { recursive: true });
  fs.writeFileSync(out, doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' }));
  console.log('✓', out);
}

const TODAS_OPCOES = [
  'aposentadoria_idade','aposentadoria_idade_urbana','aposentadoria_idade_rural',
  'aposentadoria_tempo','aposentadoria_especial',
  'pensao_morte','pensao_morte_urbana','pensao_morte_rural',
  'auxilio_reclusao','auxilio_reclusao_urbano','auxilio_reclusao_rural',
  'salario_maternidade','salario_maternidade_urbano','salario_maternidade_rural',
  'bpc','atualizacao_cadastral',
];
const TODAS_QUAL = ['tutor_nato','tutor_legal','curador','responsavel_termo_guarda','administrador_provisorio','procurador'];

// ── Teste 14 — BPC marcado ─────────────────────────────────────────────────
const cbX_bpc = {};
for (const k of TODAS_OPCOES) cbX_bpc[k] = k === 'bpc' ? 'X' : ' ';

render('14_termo_representacao_inss.docx', {
  checkbox_X: cbX_bpc,
  checkbox_qualidade_representacao_X: Object.fromEntries(TODAS_QUAL.map(q => [q, ' '])),
  tem_duas_advogadas: false, mostrar_lidiane: true, mostrar_alcione: false,
  cliente: { nome_completo: 'SEBASTIANA CORREIA DE LIRA', cpf: '123.456.789-00', rg: '12.345.678-9', rg_orgao_emissor: 'SSP/CE' },
  endereco: { logradouro: 'Rua Exemplo', numero: '100', complemento_formatado: '', bairro: 'Centro', cidade: 'Fortaleza', uf: 'CE', cep: '60000-000' },
  escritorio: { adv1_nome: 'LIDIANE ROCHA ABREU', adv1_cpf: '123.456.789-00', adv1_oab: '220.305-SP', adv2_nome: 'ALCIONE FERREIRA', adv2_cpf: '987.654.321-00', adv2_oab: '218.550-SP' },
  doc: { cidade_assinatura: 'Fortaleza (CE)', dia_assinatura: '17', mes_assinatura_numero: '05', ano_assinatura: '2026' },
}, 'TESTE_14_bpc_marcado.docx');

// ── Teste 14 — Pensão por Morte marcada ────────────────────────────────────
const cbX_pm = {};
for (const k of TODAS_OPCOES) cbX_pm[k] = (k === 'pensao_morte' || k === 'pensao_morte_urbana') ? 'X' : ' ';

render('14_termo_representacao_inss.docx', {
  checkbox_X: cbX_pm,
  checkbox_qualidade_representacao_X: Object.fromEntries(TODAS_QUAL.map(q => [q, ' '])),
  tem_duas_advogadas: true, mostrar_lidiane: true, mostrar_alcione: true,
  cliente: { nome_completo: 'MARIA DE FATIMA SOMBRA', cpf: '987.654.321-00', rg: '98.765.432-1', rg_orgao_emissor: 'SSP/CE' },
  endereco: { logradouro: 'Av. Brasil', numero: '500', complemento_formatado: '', bairro: 'Aldeota', cidade: 'Fortaleza', uf: 'CE', cep: '60150-000' },
  escritorio: { adv1_nome: 'LIDIANE ROCHA ABREU', adv1_cpf: '123.456.789-00', adv1_oab: '220.305-SP', adv2_nome: 'ALCIONE FERREIRA', adv2_cpf: '987.654.321-00', adv2_oab: '218.550-SP' },
  doc: { cidade_assinatura: 'Fortaleza (CE)', dia_assinatura: '17', mes_assinatura_numero: '05', ano_assinatura: '2026' },
}, 'TESTE_14_pensao_morte_marcada.docx');

// ── Teste 15 — tutor_nato marcado ──────────────────────────────────────────
const qualX = Object.fromEntries(TODAS_QUAL.map(q => [q, q === 'tutor_nato' ? 'X' : ' ']));

render('15_termo_responsabilidade.docx', {
  checkbox_qualidade_representacao_X: qualX,
  representacao_legal: {
    representante_nome: 'MARIA DE FATIMA SOMBRA',
    representante_cpf: '987.654.321-00',
    representante_rg: '98.765.432-1',
    qualidade_descricao: 'tutora nata',
    beneficiarios_representados: [{ nome: 'FILHO MENOR DA SILVA', cpf: '111.222.333-44' }],
  },
  cliente: { nome_completo: 'FILHO MENOR DA SILVA', cpf: '111.222.333-44', rg: '11.111.111-1', data_nascimento: '10/03/2015' },
  endereco: { logradouro: 'Rua Exemplo', numero: '100', complemento_formatado: '', bairro: 'Centro', cidade: 'Fortaleza', uf: 'CE', cep: '60000-000' },
  doc: { cidade_assinatura: 'Fortaleza (CE)', dia_assinatura: '17', mes_assinatura_numero: '05', ano_assinatura: '2026' },
  instituidor: { nome_completo: 'FRANCISCO SOMBRA', data_obito: '01/01/2025' },
  dependente_titular: { relacao_com_instituidor_descricao: 'filho(a)' },
}, 'TESTE_15_tutor_nato_marcado.docx');

console.log('\nAbra os arquivos acima no Word/LibreOffice para validar visualmente.');

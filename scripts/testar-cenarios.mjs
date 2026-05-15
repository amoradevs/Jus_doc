/**
 * Testa os 6 cenários da matriz de validação do Bloco 2.
 * Execute: node scripts/testar-cenarios.mjs
 *
 * Saída: scripts/output/testes/CENARIOx/  — DOCX renderizados
 *        screenshots/                      — PNG via qlmanage
 */

import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import mammoth from 'mammoth';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const angularExpressions = require('angular-expressions');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, '../templates');
const OUT_BASE = path.join(__dirname, 'output/testes');
const SS_DIR = path.join(__dirname, 'output/screenshots');

fs.mkdirSync(OUT_BASE, { recursive: true });
fs.mkdirSync(SS_DIR, { recursive: true });

// ─── Parser docxtemplater ────────────────────────────────────────────────────

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

function renderizar(templatePath, contexto) {
  const buf = fs.readFileSync(templatePath);
  const zip = new PizZip(buf);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    parser: angularParser,
    nullGetter() { return ''; },
  });
  doc.render(contexto);
  return doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
}

// ─── Dados fixos ─────────────────────────────────────────────────────────────

const ESCRITORIO = {
  adv1_nome: 'LIDIANE ROCHA ABREU',
  adv1_cpf: '123.456.789-00',
  adv1_oab: '220.305-SP',
  adv1_email: 'lidianer.abreu@gmail.com',
  adv2_nome: 'ALCIONE FERREIRA GOMES ALENCAR',
  adv2_cpf: '987.654.321-00',
  adv2_oab: '218.550-SP',
  adv2_email: 'alcionealencar@outlook.com',
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
  dia_assinatura: '15',
  mes_assinatura_extenso: 'maio',
  mes_assinatura_numero: '05',
  ano_assinatura: '2026',
};

const HONORARIOS = {
  qtd_salarios: 3, qtd_salarios_extenso: 'três',
  percentual_padrao: 30, percentual_padrao_extenso: 'trinta por cento',
  percentual_recurso: 40, percentual_recurso_extenso: 'quarenta por cento',
  valor_fixo: '', valor_fixo_extenso: '',
};

const HONORARIOS_MS = { ...HONORARIOS, valor_fixo: '3.000,00', valor_fixo_extenso: 'três mil reais' };
const MULTA = { qtd_salarios_minimos: 3, qtd_salarios_minimos_extenso: 'três' };

const TESTEMUNHAS = [
  { nome_completo: 'Roberto Lopes de Abreu Júnior', cpf: '010.337.257-14', rg: '371.511.80-X', data_nascimento: '28/02/1971' },
  { nome_completo: 'Adilson Lisboa Mendes', cpf: '142.821.228-03', rg: '20.283.182', data_nascimento: '04/11/1970' },
];

const TODAS_OPCOES_CHECKBOX = [
  'aposentadoria_idade', 'aposentadoria_idade_urbana', 'aposentadoria_idade_rural',
  'aposentadoria_tempo', 'aposentadoria_especial',
  'pensao_morte', 'pensao_morte_urbana', 'pensao_morte_rural',
  'auxilio_reclusao', 'auxilio_reclusao_urbano', 'auxilio_reclusao_rural',
  'salario_maternidade', 'salario_maternidade_urbano', 'salario_maternidade_rural',
  'bpc', 'atualizacao_cadastral',
];

function checkboxes(marcados) {
  const cb = {};
  for (const k of TODAS_OPCOES_CHECKBOX) cb[k] = marcados.includes(k) ? '☑' : '☐';
  return cb;
}

function advFlags(sel) {
  return {
    tem_duas_advogadas: sel === 'ambas',
    mostrar_lidiane:    sel === 'lidiane' || sel === 'ambas',
    mostrar_alcione:    sel === 'alcione' || sel === 'ambas',
    apenas_lidiane:     sel === 'lidiane',
    apenas_alcione:     sel === 'alcione',
  };
}

function clienteBase(nome, cpf, nasc, cidade = 'São Paulo', uf = 'SP') {
  return {
    nome_completo: nome.toUpperCase(),
    nacionalidade: 'brasileiro(a)',
    estado_civil: 'solteiro(a)',
    cpf,
    rg: '12.345.678-9',
    rg_orgao_emissor: 'SSP/SP',
    data_nascimento: nasc,
    nome_mae: 'Maria de Jesus',
    condicao_menor: '',
  };
}

function enderecoBase(cidade = 'São Paulo', uf = 'SP') {
  return {
    logradouro: 'Rua das Flores', numero: '100',
    complemento_formatado: '', bairro: 'Centro',
    cidade, uf, cep: '01310-100',
  };
}

const BASE_ADULTO_BPC = {
  bloco_contratante_maior_capaz: true, bloco_contratante_a_rogo: false, bloco_contratante_menor: false,
  bloco_honorarios_padrao: true, bloco_honorarios_menor: false, bloco_honorarios_mandado_seguranca: false,
  bloco_assinatura_adulto: true, bloco_assinatura_a_rogo: false, bloco_assinatura_menor: false,
  bloco_paragrafos_recurso: true,
  honorarios: HONORARIOS, multa: MULTA, testemunhas: TESTEMUNHAS,
  escritorio: ESCRITORIO, doc: DOC,
  representante: { nome_completo: '', cpf: '', rg: '', parentesco: '' },
};

// ─── 6 Cenários ──────────────────────────────────────────────────────────────

const CENARIOS = [
  {
    num: 1, label: 'Gustavo_Romanha_BPC_LidianeOnly',
    adv: 'lidiane',
    templates: {
      contrato:  '01_contrato_bpc_adulto.docx',
      procuracao: '05_procuracao_bpc_adulto.docx',
      termo:     '14_termo_representacao_inss.docx',
    },
    ctx: {
      ...BASE_ADULTO_BPC,
      ...advFlags('lidiane'),
      cliente: clienteBase('Gustavo Romanha', '111.222.333-44', '12/05/1965'),
      endereco: enderecoBase(),
      processo: {
        tipo_beneficio_descricao: 'BENEFÍCIO DE PRESTAÇÃO CONTINUADA – BPC/LOAS',
        objeto_procuracao: 'ingressar com Pedido de BENEFÍCIO DE PRESTAÇÃO CONTINUADA EM FACE DA PREVIDÊNCIA SOCIAL (Instituto Nacional do Seguro Social – INSS)',
      },
      checkbox: checkboxes(['bpc']),
    },
  },
  {
    num: 2, label: 'Caroline_Fulaninha_AposTempoContr_AlcioneOnly',
    adv: 'alcione',
    templates: {
      contrato:  '01_contrato_bpc_adulto.docx',
      procuracao: '05_procuracao_bpc_adulto.docx',
      termo:     '14_termo_representacao_inss.docx',
    },
    ctx: {
      ...BASE_ADULTO_BPC,
      ...advFlags('alcione'),
      cliente: clienteBase('Caroline Fulaninha', '222.333.444-55', '03/11/1970'),
      endereco: enderecoBase('Campinas', 'SP'),
      processo: {
        tipo_beneficio_descricao: 'BENEFÍCIO DE APOSENTADORIA POR TEMPO DE CONTRIBUIÇÃO',
        objeto_procuracao: 'ingressar com Pedido de BENEFÍCIO DE APOSENTADORIA POR TEMPO DE CONTRIBUIÇÃO EM FACE DA PREVIDÊNCIA SOCIAL (Instituto Nacional do Seguro Social – INSS)',
      },
      checkbox: checkboxes(['aposentadoria_tempo']),
      doc: { ...DOC, cidade_assinatura: 'Campinas (SP)' },
    },
  },
  {
    num: 3, label: 'Maria_das_Gracas_BPC_Ambas',
    adv: 'ambas',
    templates: {
      contrato:  '01_contrato_bpc_adulto.docx',
      procuracao: '05_procuracao_bpc_adulto.docx',
      termo:     '14_termo_representacao_inss.docx',
    },
    ctx: {
      ...BASE_ADULTO_BPC,
      ...advFlags('ambas'),
      cliente: clienteBase('Maria das Graças Silva', '333.444.555-66', '18/07/1959'),
      endereco: enderecoBase('São Paulo', 'SP'),
      processo: {
        tipo_beneficio_descricao: 'BENEFÍCIO DE PRESTAÇÃO CONTINUADA – BPC/LOAS',
        objeto_procuracao: 'ingressar com Pedido de BENEFÍCIO DE PRESTAÇÃO CONTINUADA EM FACE DA PREVIDÊNCIA SOCIAL (Instituto Nacional do Seguro Social – INSS)',
      },
      checkbox: checkboxes(['bpc']),
    },
  },
  {
    num: 4, label: 'Roberto_Abreu_BPC_LidianeOnly',
    adv: 'lidiane',
    templates: {
      contrato:  '01_contrato_bpc_adulto.docx',
      procuracao: '05_procuracao_bpc_adulto.docx',
      termo:     '14_termo_representacao_inss.docx',
    },
    ctx: {
      ...BASE_ADULTO_BPC,
      ...advFlags('lidiane'),
      cliente: clienteBase('Roberto Abreu', '444.555.666-77', '25/03/1950'),
      endereco: enderecoBase('Santo André', 'SP'),
      processo: {
        tipo_beneficio_descricao: 'BENEFÍCIO DE PRESTAÇÃO CONTINUADA – BPC/LOAS',
        objeto_procuracao: 'ingressar com Pedido de BENEFÍCIO DE PRESTAÇÃO CONTINUADA EM FACE DA PREVIDÊNCIA SOCIAL (Instituto Nacional do Seguro Social – INSS)',
      },
      checkbox: checkboxes(['bpc']),
      doc: { ...DOC, cidade_assinatura: 'Santo André (SP)' },
    },
  },
  {
    num: 5, label: 'Renata_Aparecida_AposTempoContr_Ambas',
    adv: 'ambas',
    templates: {
      contrato:  '01_contrato_bpc_adulto.docx',
      procuracao: '05_procuracao_bpc_adulto.docx',
      termo:     '14_termo_representacao_inss.docx',
    },
    ctx: {
      ...BASE_ADULTO_BPC,
      ...advFlags('ambas'),
      cliente: clienteBase('Renata Aparecida de Lima', '555.666.777-88', '08/09/1968'),
      endereco: enderecoBase('São Paulo', 'SP'),
      processo: {
        tipo_beneficio_descricao: 'BENEFÍCIO DE APOSENTADORIA POR TEMPO DE CONTRIBUIÇÃO',
        objeto_procuracao: 'ingressar com Pedido de BENEFÍCIO DE APOSENTADORIA POR TEMPO DE CONTRIBUIÇÃO EM FACE DA PREVIDÊNCIA SOCIAL (Instituto Nacional do Seguro Social – INSS)',
      },
      checkbox: checkboxes(['aposentadoria_tempo']),
    },
  },
  {
    num: 6, label: 'Cliente_Ficticio_MS_AlcioneOnly',
    adv: 'alcione',
    templates: {
      contrato:  '01_contrato_bpc_adulto.docx',
      procuracao: '08_procuracao_mandado_seguranca.docx',
      termo:     '14_termo_representacao_inss.docx',
    },
    // Declaração de hipossuficiência é documento do cliente; não lista advogada
    extras: { declaracao: '09_declaracao_hipossuficiencia.docx' },
    ctx: {
      ...BASE_ADULTO_BPC,
      ...advFlags('alcione'),
      bloco_honorarios_padrao: false,
      bloco_honorarios_mandado_seguranca: true,
      bloco_paragrafos_recurso: false,
      honorarios: HONORARIOS_MS,
      cliente: clienteBase('Joaquim Teste Fictício', '666.777.888-99', '14/02/1978'),
      endereco: enderecoBase('São Paulo', 'SP'),
      processo: {
        tipo_beneficio_descricao: 'IMPETRAÇÃO DE MANDADO DE SEGURANÇA',
        objeto_procuracao: 'impetrar MANDADO DE SEGURANÇA em face do INSS (Instituto Nacional do Seguro Social)',
      },
      checkbox: checkboxes([]),
    },
  },
];

// ─── Run ─────────────────────────────────────────────────────────────────────

const ADV1 = 'LIDIANE ROCHA ABREU';
const ADV2 = 'ALCIONE FERREIRA GOMES ALENCAR';

function verificarTexto(nome, texto, advSel) {
  const erros = [];

  // Raw tags never visible
  if (/\{[#^/][^}]+\}/.test(texto)) erros.push('Tag docxtemplater visível no texto renderizado');

  // Correct lawyer present
  if (advSel === 'lidiane' || advSel === 'ambas') {
    if (!texto.includes('LIDIANE')) erros.push('LIDIANE não encontrada no documento (deveria aparecer)');
  }
  if (advSel === 'alcione' || advSel === 'ambas') {
    if (!texto.includes('ALCIONE')) erros.push('ALCIONE não encontrada no documento (deveria aparecer)');
  }

  // Wrong lawyer absent
  if (advSel === 'lidiane' && texto.includes('ALCIONE')) erros.push('ALCIONE aparece mas NÃO deveria');
  if (advSel === 'alcione' && texto.includes('LIDIANE')) erros.push('LIDIANE aparece mas NÃO deveria');

  return erros;
}

console.log('\n══════════════════════════════════════════════');
console.log(' MATRIZ DE TESTES — BLOCO 2');
console.log('══════════════════════════════════════════════\n');

const docxParaScreenshot = [];
let totalOk = 0;
let totalErro = 0;

for (const cenario of CENARIOS) {
  const outDir = path.join(OUT_BASE, `CENARIO_${cenario.num}`);
  fs.mkdirSync(outDir, { recursive: true });

  console.log(`\n── Cenário ${cenario.num}: ${cenario.label.replace(/_/g, ' ')} ──`);
  console.log(`   Advogada: ${cenario.adv}`);

  const allTemplates = [
    ...Object.entries(cenario.templates).map(([t, f]) => ({ tipo: t, file: f, checkAdv: true })),
    ...Object.entries(cenario.extras ?? {}).map(([t, f]) => ({ tipo: t, file: f, checkAdv: false })),
  ];

  for (const { tipo, file: templateFile, checkAdv } of allTemplates) {
    const templatePath = path.join(TEMPLATES_DIR, templateFile);
    if (!fs.existsSync(templatePath)) {
      console.log(`   ⚠️  ${tipo}: template não encontrado: ${templateFile}`);
      continue;
    }

    const outFile = path.join(outDir, `${tipo}.docx`);
    try {
      const rendered = renderizar(templatePath, cenario.ctx);
      fs.writeFileSync(outFile, rendered);

      const { value: texto } = await mammoth.extractRawText({ buffer: rendered });
      const erros = checkAdv ? verificarTexto(tipo, texto, cenario.adv) : [];

      if (erros.length === 0) {
        console.log(`   ✅ ${tipo} (${templateFile}) — OK`);
        totalOk++;
      } else {
        erros.forEach(e => console.error(`   ❌ ${tipo}: ${e}`));
        totalErro++;
      }
      docxParaScreenshot.push({ label: `C${cenario.num}_${tipo}`, file: outFile });
    } catch (e) {
      console.error(`   ❌ ${tipo}: ERRO — ${e.message}`);
      if (e.properties?.errors) e.properties.errors.forEach(err => console.error('      ', err.message));
      totalErro++;
    }
  }
}

console.log(`\n══════════════════════════════════════════════`);
console.log(` ${totalOk + totalErro} arquivos | ${totalOk} OK | ${totalErro} com erro`);
console.log('══════════════════════════════════════════════\n');

if (totalErro > 0) {
  console.log('⚠️  Há erros — não gerando screenshots.');
  process.exit(1);
}

// ─── Screenshots via qlmanage ─────────────────────────────────────────────────
console.log('Gerando screenshots (qlmanage)...\n');
for (const { label, file } of docxParaScreenshot) {
  try {
    // qlmanage grava em SS_DIR com o basename do arquivo de entrada
    const qlOut = path.join(SS_DIR, path.basename(file) + '.png');
    const dst   = path.join(SS_DIR, `${label}.png`);
    // Remover eventual arquivo anterior com o mesmo nome genérico
    if (fs.existsSync(qlOut)) fs.unlinkSync(qlOut);
    execSync(`qlmanage -t -s 1400 -o "${SS_DIR}/" "${file}" 2>/dev/null`, { stdio: 'pipe' });
    if (fs.existsSync(qlOut)) {
      fs.renameSync(qlOut, dst);
      console.log(`  📸 ${label}.png`);
    } else {
      console.log(`  ⚠️  ${label} — qlmanage não gerou PNG`);
    }
  } catch { /* qlmanage retorna exit 1 mesmo com sucesso */ }
}

console.log(`\n✅ Screenshots em: scripts/output/screenshots/`);

import { NextResponse } from 'next/server';
import { z } from 'zod';
import path from 'path';
import { getCurrentUser } from '@/lib/auth-helpers';
import { renderDocxTemplate } from '@/lib/document-generation/docx-renderer';
import { db } from '@/lib/db';
import type { ResultadoCalculo, MelhorOpcao } from '@/lib/motor-previdenciario';

const bodySchema = z.object({
  tipo: z.enum(['planejamento', 'email']),
  entrada: z.object({
    nome: z.string(),
    cpf: z.string(),
    dataNascimento: z.string(),
    sexo: z.enum(['M', 'F']),
    der: z.string(),
  }),
  resultado: z.record(z.string(), z.unknown()),
});

function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarPorcentagem(coef: number): string {
  return `${(coef * 100).toFixed(2)}%`;
}

function statusRegra(data: string | null): string {
  if (!data) return 'Não atingido no horizonte de projeção';
  const ano = parseInt(data.split('-')[0]);
  const anoAtual = new Date().getFullYear();
  return ano <= anoAtual ? 'Já atingido' : `Projeção: ${formatarData(data)}`;
}

const TZ_BR = 'America/Sao_Paulo';

function dataHojeBR(): string {
  return new Date().toLocaleDateString('pt-BR', { timeZone: TZ_BR });
}

function dataHojeExtenso(): string {
  return new Date().toLocaleDateString('pt-BR', {
    timeZone: TZ_BR,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function nomeRegraMelhorOpcao(opcao: MelhorOpcao): string {
  const map: Record<string, string> = {
    art15: 'Sistema de Pontos',
    art16: 'Idade Progressiva',
    art17: 'Pedágio 50%',
    art18: 'Aposentadoria por Idade',
    art20: 'Pedágio 100%',
  };
  return opcao ? map[opcao] : '—';
}

function numeroArtigoMelhorOpcao(opcao: MelhorOpcao): string {
  const map: Record<string, string> = {
    art15: '15', art16: '16', art17: '17', art18: '18', art20: '20',
  };
  return opcao ? map[opcao] : '—';
}

function idadeNaMelhorData(dataMelhor: string | null, dataNasc: string): string {
  if (!dataMelhor) return '—';
  const nasc = new Date(dataNasc);
  const meta = new Date(dataMelhor);
  const anos = Math.floor((meta.getTime() - nasc.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  return `${anos} anos`;
}

function buildContext(
  entrada: z.infer<typeof bodySchema>['entrada'],
  resultado: ResultadoCalculo,
  escritorio: Record<string, string>,
) {
  const res = resultado;
  return {
    segurado_nome: entrada.nome,
    segurado_cpf: entrada.cpf,
    segurado_nascimento: formatarData(entrada.dataNascimento),
    segurado_sexo: entrada.sexo === 'F' ? 'Feminino' : 'Masculino',
    der_formatada: formatarData(entrada.der),
    data_calculo: dataHojeBR(),
    data_extenso: dataHojeExtenso(),
    total_contributivo: res.totalContributivoFormatado,

    art15_status: statusRegra(res.art15Pontos.dataCumprimento),
    art15_data: res.art15Pontos.dataCumprimento ? formatarData(res.art15Pontos.dataCumprimento) : '—',
    art15_elegivel: res.art15Pontos.elegivel ? 'Sim' : 'Não',
    art15_obs: res.art15Pontos.observacao,
    art15_pontos_atuais: res.art15Pontos.pontosNaDer?.toString() ?? '—',
    art15_pontos_necessarios: res.art15Pontos.pontosNecessariosNaDer?.toString() ?? '—',

    art16_status: statusRegra(res.art16IdadeProgressiva.dataCumprimento),
    art16_data: res.art16IdadeProgressiva.dataCumprimento ? formatarData(res.art16IdadeProgressiva.dataCumprimento) : '—',
    art16_elegivel: res.art16IdadeProgressiva.elegivel ? 'Sim' : 'Não',
    art16_obs: res.art16IdadeProgressiva.observacao,
    art16_idade_necessaria: res.art16IdadeProgressiva.idadeNecessaria ?? '—',

    art17_status: statusRegra(res.art17Pedagio50.dataCumprimento),
    art17_data: res.art17Pedagio50.dataCumprimento ? formatarData(res.art17Pedagio50.dataCumprimento) : '—',
    art17_elegivel: res.art17Pedagio50.elegivel ? 'Sim' : 'Não',
    art17_obs: res.art17Pedagio50.observacao,

    art18_status: statusRegra(res.art18AposIdade.dataCumprimento),
    art18_data: res.art18AposIdade.dataCumprimento ? formatarData(res.art18AposIdade.dataCumprimento) : '—',
    art18_elegivel: res.art18AposIdade.elegivel ? 'Sim' : 'Não',
    art18_obs: res.art18AposIdade.observacao,

    art20_status: statusRegra(res.art20Pedagio100.dataCumprimento),
    art20_data: res.art20Pedagio100.dataCumprimento ? formatarData(res.art20Pedagio100.dataCumprimento) : '—',
    art20_elegivel: res.art20Pedagio100.elegivel ? 'Sim' : 'Não',
    art20_obs: res.art20Pedagio100.observacao,

    salario_beneficio: formatarMoeda(res.salarioBeneficio),
    coeficiente_ec103: formatarPorcentagem(res.coeficienteEC103),
    beneficio_mensal: formatarMoeda(res.beneficioMensal),
    teto_inss: formatarMoeda(res.tetoINSS),

    escritorio_advogada: escritorio.advogada_principal_nome ?? '',
    escritorio_oab: escritorio.advogada_principal_oab ?? '',
    escritorio_cidade: escritorio.endereco_cidade ?? '',

    // Booleanos para condicionais de filtragem no template
    art15_elegivel_bool: res.art15Pontos.elegivel,
    art16_elegivel_bool: res.art16IdadeProgressiva.elegivel,
    art17_elegivel_bool: res.art17Pedagio50.elegivel,
    art18_elegivel_bool: res.art18AposIdade.elegivel,
    art20_elegivel_bool: res.art20Pedagio100.elegivel,

    tem_inelegivel:
      !res.art15Pontos.elegivel ||
      !res.art16IdadeProgressiva.elegivel ||
      !res.art17Pedagio50.elegivel ||
      !res.art18AposIdade.elegivel ||
      !res.art20Pedagio100.elegivel,

    // Caixa de recomendação no topo do documento
    melhor_artigo_titulo: nomeRegraMelhorOpcao(res.melhorOpcao),
    melhor_artigo_numero: numeroArtigoMelhorOpcao(res.melhorOpcao),
    melhor_data: res.dataMaisProxima ? formatarData(res.dataMaisProxima) : '—',
    melhor_idade: idadeNaMelhorData(res.dataMaisProxima, entrada.dataNascimento),
  };
}

export async function POST(req: Request) {
  const user = await getCurrentUser();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', detalhes: parsed.error.flatten() }, { status: 422 });
  }

  const { tipo, entrada, resultado } = parsed.data;

  const { data: settingsRows } = await db
    .from('office_settings')
    .select('*')
    .eq('tenant_id', user.tenantId)
    .limit(1);

  const escritorio = (settingsRows?.[0] ?? {}) as Record<string, string>;

  const templateFile =
    tipo === 'planejamento'
      ? 'templates/planejamento_previdenciario.docx'
      : 'templates/email_segurado.docx';

  const templatePath = path.resolve(process.cwd(), templateFile);
  const context = buildContext(entrada, resultado as ResultadoCalculo, escritorio);

  try {
    const buffer = await renderDocxTemplate(templatePath, context as never);
    const nomeArquivo = tipo === 'planejamento'
      ? `planejamento_${entrada.nome.replace(/\s+/g, '_')}.docx`
      : `email_${entrada.nome.replace(/\s+/g, '_')}.docx`;

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${nomeArquivo}"`,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

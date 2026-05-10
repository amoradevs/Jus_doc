import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { labelTipoBeneficio, labelStatusResultado } from '@/lib/processo';

const ETAPA_LABEL: Record<string, string> = {
  triagem: 'Triagem',
  consulta: 'Consulta',
  documentos: 'Documentos',
  aguardando_inss: 'Aguardando INSS',
  pericia: 'Perícia',
  judicial: 'Judicial',
  concedido: 'Concedido',
  encerrado: 'Encerrado',
};

function csvCell(val: unknown): string {
  if (val === null || val === undefined || val === '') return '';
  const s = String(val).replace(/"/g, '""');
  return /[;"\n\r]/.test(s) ? `"${s}"` : s;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso.length === 10 ? iso + 'T12:00:00' : iso);
  return d.toLocaleDateString('pt-BR');
}

type ClientRow = {
  id: string;
  nome_completo: string;
  cpf: string;
  data_nascimento: string;
  genero: string;
  estado_civil: string | null;
  nacionalidade: string | null;
  telefone: string | null;
  rg: string | null;
  rg_orgao_emissor: string | null;
  nome_mae: string | null;
  nome_pai: string | null;
  endereco_logradouro: string;
  endereco_numero: string;
  endereco_complemento: string | null;
  endereco_bairro: string;
  endereco_cidade: string;
  endereco_uf: string;
  endereco_cep: string;
  criado_em: string;
};

type ProcessoRow = {
  cliente_id: string;
  numero_interno: string;
  tipo_beneficio: string | null;
  status_resultado: string;
  etapa_pipeline: string;
  data_entrada: string | null;
  data_proxima_audiencia: string | null;
  data_prazo: string | null;
};

export async function GET(req: Request) {
  let user;
  try {
    user = await getCurrentUser();
  } catch {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const periodo = searchParams.get('periodo');
  const mes = searchParams.get('mes');
  const ano = searchParams.get('ano');

  let query = db
    .from('clients')
    .select(
      'id,nome_completo,cpf,data_nascimento,genero,estado_civil,nacionalidade,' +
      'telefone,rg,rg_orgao_emissor,nome_mae,nome_pai,' +
      'endereco_logradouro,endereco_numero,endereco_complemento,endereco_bairro,endereco_cidade,endereco_uf,endereco_cep,' +
      'criado_em'
    )
    .eq('tenant_id', user.tenantId)
    .is('deletado_em', null)
    .order('criado_em', { ascending: false });

  const agora = new Date();

  if (periodo === '7d') {
    query = query.gte('criado_em', new Date(agora.getTime() - 7 * 86400000).toISOString());
  } else if (periodo === '30d') {
    query = query.gte('criado_em', new Date(agora.getTime() - 30 * 86400000).toISOString());
  } else if (periodo === '90d') {
    query = query.gte('criado_em', new Date(agora.getTime() - 90 * 86400000).toISOString());
  } else if (mes || ano) {
    const anoNum = ano ? parseInt(ano) : agora.getFullYear();
    const mesNum = mes ? parseInt(mes) : null;
    if (mesNum) {
      query = query
        .gte('criado_em', new Date(anoNum, mesNum - 1, 1).toISOString())
        .lte('criado_em', new Date(anoNum, mesNum, 0, 23, 59, 59, 999).toISOString());
    } else {
      query = query
        .gte('criado_em', new Date(anoNum, 0, 1).toISOString())
        .lte('criado_em', new Date(anoNum, 11, 31, 23, 59, 59, 999).toISOString());
    }
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as unknown as ClientRow[];

  // Busca processos de todos os clientes retornados (join em memória)
  const processoMap = new Map<string, ProcessoRow[]>();
  if (rows.length > 0) {
    const ids = rows.map((r) => r.id);
    const { data: processoData } = await db
      .from('processos')
      .select('cliente_id,numero_interno,tipo_beneficio,status_resultado,etapa_pipeline,data_entrada,data_proxima_audiencia,data_prazo')
      .eq('tenant_id', user.tenantId)
      .in('cliente_id', ids);

    for (const p of (processoData ?? []) as ProcessoRow[]) {
      const list = processoMap.get(p.cliente_id) ?? [];
      list.push(p);
      processoMap.set(p.cliente_id, list);
    }
  }

  const headers = [
    'Nome Completo', 'CPF', 'Data de Nascimento', 'Gênero', 'Estado Civil', 'Nacionalidade',
    'Telefone', 'RG', 'Órgão Emissor', 'Nome da Mãe', 'Nome do Pai',
    'Endereço', 'Bairro', 'Cidade', 'UF', 'CEP',
    'Nº Processo', 'Tipo de Benefício', 'Status', 'Etapa Pipeline',
    'Data de Entrada', 'Próxima Audiência', 'Prazo', 'Cadastrado em',
  ];

  // Uma linha por processo; se cliente não tem processo, uma linha com campos vazios
  const csvRows: string[] = [];
  for (const r of rows) {
    const processos = processoMap.get(r.id) ?? [];
    const commonCells = [
      csvCell(r.nome_completo),
      csvCell(r.cpf),
      csvCell(fmtDate(r.data_nascimento)),
      csvCell(r.genero === 'F' ? 'Feminino' : r.genero === 'M' ? 'Masculino' : r.genero),
      csvCell(r.estado_civil),
      csvCell(r.nacionalidade),
      csvCell(r.telefone),
      csvCell(r.rg),
      csvCell(r.rg_orgao_emissor),
      csvCell(r.nome_mae),
      csvCell(r.nome_pai),
      csvCell([r.endereco_logradouro, r.endereco_numero, r.endereco_complemento].filter(Boolean).join(', ')),
      csvCell(r.endereco_bairro),
      csvCell(r.endereco_cidade),
      csvCell(r.endereco_uf),
      csvCell(r.endereco_cep),
    ];

    if (processos.length === 0) {
      csvRows.push([...commonCells, '', '', '', '', '', '', '', csvCell(fmtDate(r.criado_em))].join(';'));
    } else {
      for (const p of processos) {
        csvRows.push([
          ...commonCells,
          csvCell(p.numero_interno),
          csvCell(labelTipoBeneficio(p.tipo_beneficio)),
          csvCell(labelStatusResultado(p.status_resultado)),
          csvCell(ETAPA_LABEL[p.etapa_pipeline] ?? p.etapa_pipeline),
          csvCell(fmtDate(p.data_entrada)),
          csvCell(fmtDate(p.data_proxima_audiencia)),
          csvCell(fmtDate(p.data_prazo)),
          csvCell(fmtDate(r.criado_em)),
        ].join(';'));
      }
    }
  }

  const csv = ['﻿' + headers.join(';'), ...csvRows].join('\r\n');
  const hoje = agora.toLocaleDateString('pt-BR').replace(/\//g, '-');
  const filename = `clientes-${hoje}.csv`;

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

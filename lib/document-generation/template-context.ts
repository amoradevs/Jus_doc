import { db } from '@/lib/db';
import { formatDateExtenso } from '@/lib/format/date';

export type TemplateContext = {
  cliente: Record<string, string | undefined>;
  escritorio: Record<string, string | undefined>;
  documento: { cidade: string; uf: string; data_extenso: string };
  representante?: Record<string, string | undefined>;
  conjuge?: Record<string, string | undefined>;
  filho_dependente?: Record<string, string | undefined>;
  imovel?: Record<string, string | undefined>;
  empresa_mei?: Record<string, string | undefined>;
  testemunhas?: Record<string, string | undefined>[];
};

export async function buildTemplateContext(clientId: string, tenantId: string): Promise<TemplateContext> {
  const { data: clientRows } = await db
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .eq('tenant_id', tenantId)
    .is('deletado_em', null)
    .limit(1);

  const client = clientRows?.[0];
  if (!client) throw new Error('Cliente não encontrado');

  const { data: contextualRows } = await db
    .from('client_contextual_data')
    .select('*')
    .eq('client_id', clientId)
    .limit(1);

  const { data: settingsRows } = await db
    .from('office_settings')
    .select('*')
    .eq('tenant_id', tenantId)
    .limit(1);

  const contextual = contextualRows?.[0] ?? null;
  const settings = settingsRows?.[0] ?? null;

  const ctx: TemplateContext = {
    cliente: {
      nome_completo: client.nome_completo,
      nacionalidade: client.nacionalidade,
      genero: client.genero === 'F' ? 'feminino' : 'masculino',
      estado_civil: client.estado_civil,
      data_nascimento: new Date(client.data_nascimento).toLocaleDateString('pt-BR'),
      cpf: client.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'),
      rg: client.rg,
      rg_orgao_emissor: client.rg_orgao_emissor,
      nome_mae: client.nome_mae,
      nome_pai: client.nome_pai ?? undefined,
      endereco_logradouro: client.endereco_logradouro,
      endereco_numero: client.endereco_numero,
      endereco_complemento: client.endereco_complemento ?? undefined,
      endereco_bairro: client.endereco_bairro,
      endereco_cidade: client.endereco_cidade,
      endereco_uf: client.endereco_uf,
      endereco_cep: client.endereco_cep.replace(/(\d{5})(\d{3})/, '$1-$2'),
    },
    escritorio: settings ? {
      advogada_principal_nome: settings.advogada_principal_nome,
      advogada_principal_nome_curto: settings.advogada_principal_nome_curto,
      advogada_principal_oab: settings.advogada_principal_oab,
      advogada_principal_email: settings.advogada_principal_email,
      advogada_parceira_nome: settings.advogada_parceira_nome,
      advogada_parceira_nome_curto: settings.advogada_parceira_nome_curto,
      advogada_parceira_oab: settings.advogada_parceira_oab,
      advogada_parceira_email: settings.advogada_parceira_email,
      endereco_logradouro: settings.endereco_logradouro,
      endereco_numero: settings.endereco_numero,
      endereco_complemento: settings.endereco_complemento ?? undefined,
      endereco_bairro: settings.endereco_bairro,
      endereco_cidade: settings.endereco_cidade,
      endereco_uf: settings.endereco_uf,
      endereco_cep: settings.endereco_cep,
    } : {},
    documento: {
      cidade: settings?.endereco_cidade ?? '',
      uf: settings?.endereco_uf ?? '',
      data_extenso: formatDateExtenso(new Date()),
    },
  };

  if (contextual?.representante_legal) ctx.representante = contextual.representante_legal as Record<string, string>;
  if (contextual?.conjuge) ctx.conjuge = contextual.conjuge as Record<string, string>;
  if (contextual?.filho_dependente) ctx.filho_dependente = contextual.filho_dependente as Record<string, string>;
  if (contextual?.imovel) ctx.imovel = contextual.imovel as Record<string, string>;
  if (contextual?.empresa_mei) ctx.empresa_mei = contextual.empresa_mei as Record<string, string>;

  return ctx;
}

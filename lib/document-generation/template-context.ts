import { db } from '@/lib/db';
import { clients, client_contextual_data, office_settings } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
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
  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.tenant_id, tenantId), isNull(clients.deletado_em)))
    .limit(1);

  if (!client) throw new Error('Cliente não encontrado');

  const [contextual] = await db
    .select()
    .from(client_contextual_data)
    .where(eq(client_contextual_data.client_id, clientId))
    .limit(1);

  const [settings] = await db
    .select()
    .from(office_settings)
    .where(eq(office_settings.tenant_id, tenantId))
    .limit(1);

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

  const c = contextual;
  if (c?.representante_legal) ctx.representante = c.representante_legal as Record<string, string>;
  if (c?.conjuge) ctx.conjuge = c.conjuge as Record<string, string>;
  if (c?.filho_dependente) ctx.filho_dependente = c.filho_dependente as Record<string, string>;
  if (c?.imovel) ctx.imovel = c.imovel as Record<string, string>;
  if (c?.empresa_mei) ctx.empresa_mei = c.empresa_mei as Record<string, string>;

  return ctx;
}

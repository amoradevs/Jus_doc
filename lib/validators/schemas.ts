import { z } from 'zod';
import { isValidCPF } from './cpf';
import { isValidCNPJ } from './cnpj';

export const officeSettingsSchema = z.object({
  advogada_principal_nome: z.string().min(3, 'Nome obrigatório'),
  advogada_principal_nome_curto: z.string().min(2, 'Nome curto obrigatório'),
  advogada_principal_cpf: z.string().refine(isValidCPF, 'CPF inválido'),
  advogada_principal_oab: z.string().min(3, 'OAB obrigatória'),
  advogada_principal_email: z.string().email('E-mail inválido'),
  advogada_parceira_nome: z.string(),
  advogada_parceira_nome_curto: z.string(),
  advogada_parceira_cpf: z.string(),
  advogada_parceira_oab: z.string(),
  advogada_parceira_email: z.string(),
  endereco_logradouro: z.string().min(3, 'Logradouro obrigatório'),
  endereco_numero: z.string().min(1, 'Número obrigatório'),
  endereco_complemento: z.string().optional(),
  endereco_bairro: z.string().min(2, 'Bairro obrigatório'),
  endereco_cidade: z.string().min(2, 'Cidade obrigatória'),
  endereco_uf: z.string().length(2, 'UF deve ter 2 letras'),
  endereco_cep: z.string().regex(/^\d{8}$/, 'CEP inválido'),
});

export type OfficeSettingsInput = z.infer<typeof officeSettingsSchema>;

export const clientSchema = z.object({
  nome_completo: z.string().min(3, 'Nome obrigatório'),
  nacionalidade: z.string().min(2, 'Nacionalidade obrigatória'),
  genero: z.enum(['M', 'F'], { message: 'Selecione o gênero' }),
  estado_civil: z.enum(['solteiro', 'casado', 'separado', 'divorciado', 'viuvo', 'uniao_estavel', 'companheiro'], { message: 'Selecione o estado civil' }),
  data_nascimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  cpf: z.string().refine((v) => isValidCPF(v), 'CPF inválido'),
  rg: z.string().refine((v) => !v || v.length >= 3, 'RG deve ter pelo menos 3 caracteres').optional(),
  rg_orgao_emissor: z.string().refine((v) => !v || v.length >= 2, 'Órgão emissor inválido').optional(),
  nome_mae: z.string().min(3, 'Nome da mãe obrigatório'),
  nome_pai: z.string().optional(),
  telefone: z.string().optional(),
  endereco_logradouro: z.string().min(3, 'Logradouro obrigatório'),
  endereco_numero: z.string(),
  endereco_complemento: z.string().optional(),
  endereco_bairro: z.string().min(2, 'Bairro obrigatório'),
  endereco_cidade: z.string().min(2, 'Cidade obrigatória'),
  endereco_uf: z.string().length(2, 'UF deve ter 2 letras'),
  endereco_cep: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido — informe 8 dígitos'),
  senha_cadastro: z.string().optional(),
});

export type ClientInput = z.infer<typeof clientSchema>;

export const representanteLegalSchema = z.object({
  nome: z.string().min(3),
  cpf: z.string().refine(isValidCPF, 'CPF inválido'),
  rg: z.string().refine((v) => !v || v.length >= 3, 'RG deve ter pelo menos 3 caracteres').optional(),
  parentesco: z.string().min(2),
  nome_mae: z.string().min(3),
});

export const conjugeSchema = z.object({
  data_separacao: z.string().min(1, 'Data obrigatória'),
  recebe_pensao: z.boolean().optional(),
  valor_pensao: z.string().optional(),
});

export const filhoDependenteSchema = z.object({
  nome: z.string().min(3),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  data_nascimento: z.string().min(1),
});

export const empresaMeiSchema = z.object({
  razao_social: z.string().min(3),
  cnpj: z.string().refine(isValidCNPJ, 'CNPJ inválido'),
  cnae: z.string().min(2),
  ramo: z.string().min(2),
  data_abertura: z.string().min(1),
  data_inatividade: z.string().min(1),
  descricao_inicio_inatividade: z.string().min(5),
});

export const imovelSchema = z.object({
  proprietario_nome: z.string().min(3),
});

// ── Frente 3: Pensão por Morte ────────────────────────────────────────────────

export const instituidorSchema = z.object({
  processo_id: z.string().uuid(),
  nome_completo: z.string().min(3, 'Nome obrigatório'),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  data_nascimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida').optional().or(z.literal('')),
  data_obito: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data do óbito obrigatória'),
  qualidade_previdenciaria: z.enum([
    'segurado_ativo',
    'aposentado',
    'pensionista',
    'segurado_em_periodo_graca',
  ], { message: 'Selecione a qualidade previdenciária' }),
  numero_beneficio_origem: z.string().optional(),
  ultima_remuneracao: z.coerce.number().positive().optional(),
  observacoes: z.string().optional(),
});

export type InstituidorInput = z.infer<typeof instituidorSchema>;

export const dependenteHabilitadoSchema = z.object({
  processo_id: z.string().uuid(),
  cliente_id: z.string().uuid().optional(),
  nome_completo: z.string().min(3, 'Nome obrigatório'),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  data_nascimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de nascimento obrigatória'),
  relacao_com_instituidor: z.enum([
    'conjuge',
    'companheiro',
    'filho_menor',
    'filho_invalido_maior',
    'filho_universitario_ate_24',
    'pais',
    'irmao_menor',
    'irmao_invalido',
  ], { message: 'Selecione a relação com o instituidor' }),
  cota_parte_percentual: z.coerce.number().min(0).max(100).optional(),
  e_titular_no_sistema: z.boolean().default(false),
  observacoes: z.string().optional(),
});

export type DependenteHabilitadoInput = z.infer<typeof dependenteHabilitadoSchema>;

export const documentoProcessoSchema = z.object({
  processo_id: z.string().uuid(),
  tipo: z.enum([
    'certidao_obito',
    'rg_instituidor',
    'comprovante_dependencia',
    'certidao_casamento',
    'certidao_nascimento_filho',
    'comprovante_uniao_estavel',
    'laudo_pericial_invalidez',
    'declaracao_dependencia_economica',
    'outro',
  ], { message: 'Tipo de documento inválido' }),
  nome_arquivo: z.string().min(1, 'Nome do arquivo obrigatório'),
  storage_path: z.string().min(1, 'Caminho no storage obrigatório'),
  obrigatorio: z.boolean().default(false),
  observacoes: z.string().optional(),
});

export type DocumentoProcessoInput = z.infer<typeof documentoProcessoSchema>;

const beneficiarioRepresentadoSchema = z.object({
  nome: z.string().min(3),
  cpf: z.string().optional(),
});

export const representacaoLegalSchema = z.object({
  processo_id: z.string().uuid(),
  representante_nome: z.string().min(3, 'Nome do representante obrigatório'),
  representante_cpf: z.string().refine(isValidCPF, 'CPF inválido'),
  representante_rg: z.string().optional(),
  qualidade: z.enum([
    'tutor_nato',
    'tutor_legal',
    'curador',
    'responsavel_termo_guarda',
    'administrador_provisorio',
    'procurador',
  ], { message: 'Selecione a qualidade do representante' }),
  beneficiarios_representados: z.array(beneficiarioRepresentadoSchema).min(1, 'Informe pelo menos um beneficiário representado').max(4),
  documento_comprobatorio_tipo: z.string().optional(),
  documento_comprobatorio_numero: z.string().optional(),
});

export type RepresentacaoLegalInput = z.infer<typeof representacaoLegalSchema>;

export const processoSchema = z.object({
  tipo_beneficio: z.string().min(1, 'Selecione o tipo de benefício'),
  status_resultado: z.string().min(1, 'Selecione o status'),
  etapa_pipeline: z.string().min(1, 'Selecione a etapa'),
  data_entrada: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida').optional().or(z.literal('')),
  dib_pleiteada: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida').optional().or(z.literal('')),
  numero_protocolo_inss: z.string().optional(),
  numero_processo_judicial: z.string().optional(),
  observacao_pipeline: z.string().optional(),
});

export type ProcessoInput = z.infer<typeof processoSchema>;

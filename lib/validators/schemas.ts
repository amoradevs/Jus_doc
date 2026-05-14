import { z } from 'zod';
import { isValidCPF } from './cpf';
import { isValidCNPJ } from './cnpj';

export const officeSettingsSchema = z.object({
  advogada_principal_nome: z.string().min(3, 'Nome obrigatório'),
  advogada_principal_nome_curto: z.string().min(2, 'Nome curto obrigatório'),
  advogada_principal_cpf: z.string().refine(isValidCPF, 'CPF inválido'),
  advogada_principal_oab: z.string().min(3, 'OAB obrigatória'),
  advogada_principal_email: z.string().email('E-mail inválido'),
  advogada_parceira_nome: z.string().min(3, 'Nome obrigatório'),
  advogada_parceira_nome_curto: z.string().min(2, 'Nome curto obrigatório'),
  advogada_parceira_cpf: z.string().refine(isValidCPF, 'CPF inválido'),
  advogada_parceira_oab: z.string().min(3, 'OAB obrigatória'),
  advogada_parceira_email: z.string().email('E-mail inválido'),
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
  estado_civil: z.enum(['solteiro', 'casado', 'separado', 'divorciado', 'viuvo', 'uniao_estavel'], { message: 'Selecione o estado civil' }),
  data_nascimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  cpf: z.string().refine((v) => isValidCPF(v), 'CPF inválido'),
  rg: z.string().min(3).optional(),
  rg_orgao_emissor: z.string().min(2).optional(),
  nome_mae: z.string().min(3, 'Nome da mãe obrigatório'),
  nome_pai: z.string().optional(),
  telefone: z.string().optional(),
  endereco_logradouro: z.string().min(3, 'Logradouro obrigatório'),
  endereco_numero: z.string().min(1, 'Número obrigatório'),
  endereco_complemento: z.string().optional(),
  endereco_bairro: z.string().min(2, 'Bairro obrigatório'),
  endereco_cidade: z.string().min(2, 'Cidade obrigatória'),
  endereco_uf: z.string().length(2, 'UF deve ter 2 letras'),
  endereco_cep: z.string().regex(/^\d{8}$/, 'CEP inválido'),
  senha_cadastro: z.string().optional(),
});

export type ClientInput = z.infer<typeof clientSchema>;

export const representanteLegalSchema = z.object({
  nome: z.string().min(3),
  cpf: z.string().refine(isValidCPF, 'CPF inválido'),
  rg: z.string().min(3).optional(),
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

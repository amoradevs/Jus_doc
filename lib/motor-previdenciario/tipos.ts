export type Sexo = 'M' | 'F';

export type PeriodoContributivo = {
  inicio: string; // ISO date 'YYYY-MM-DD'
  fim: string;    // ISO date 'YYYY-MM-DD'
  origem?: 'RGPS' | 'RPPS' | 'facultativo';
};

export type SalarioContributivo = {
  competencia: string; // 'MM/YYYY'
  valor: number;       // em reais
};

export type EntradaCalculoPrevidenciario = {
  dataNascimento: string;    // ISO date
  sexo: Sexo;
  der: string;               // Data de Entrada do Requerimento (ISO date)
  periodos: PeriodoContributivo[];
  salarios: SalarioContributivo[];
  filiadoAntesDaReforma: boolean; // filiado antes de 13/11/2019
};

export type ResultadoRegra = {
  elegivel: boolean;
  dataCumprimento: string | null; // ISO date ou null se nunca atingido
  observacao: string;
};

export type MelhorOpcao = 'art15' | 'art16' | 'art17' | 'art18' | 'art20' | null;

export type ResultadoCalculo = {
  totalContributivoDias: number;
  totalContributivoFormatado: string;
  art15Pontos: ResultadoRegra & { pontosNaDer?: number; pontosNecessariosNaDer?: number };
  art16IdadeProgressiva: ResultadoRegra & { idadeNecessaria?: string };
  art17Pedagio50: ResultadoRegra;
  art18AposIdade: ResultadoRegra;
  art20Pedagio100: ResultadoRegra;
  // Regra que dá a aposentadoria mais próxima
  melhorOpcao: MelhorOpcao;
  dataMaisProxima: string | null;
  // Benefício calculado com coeficiente na data da aposentadoria projetada (mais preciso)
  salarioBeneficio: number;
  coeficienteEC103: number;      // na DER (tempo atual)
  coeficienteNaAposentadoria: number; // na data da melhor opção (mais realista)
  beneficioMensal: number;       // usando coeficienteNaAposentadoria
  tetoINSS: number;
};

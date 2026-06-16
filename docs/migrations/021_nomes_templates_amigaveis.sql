-- Atualiza os nomes dos templates para nomes amigáveis (exibição para o cliente)
-- Executar no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/oemumlmszlklpbgkwhbs/editor

update document_templates set nome = 'Contrato de Honorários'                   where codigo = '01';
update document_templates set nome = 'Procuração'                                where codigo = '02';
update document_templates set nome = 'Contrato BPC — Menor (< 16 anos)'         where codigo = '03';
update document_templates set nome = 'Contrato BPC — Menor (16 a 18 anos)'      where codigo = '04';
update document_templates set nome = 'Termo de Representação INSS'              where codigo = '05';
update document_templates set nome = 'Procuração BPC — Menor (< 16 anos)'       where codigo = '06';
update document_templates set nome = 'Procuração BPC — (16 a 18 anos)'          where codigo = '07';
update document_templates set nome = 'Procuração — Mandado de Segurança'        where codigo = '08';
update document_templates set nome = 'Declaração de Hipossuficiência'           where codigo = '09';
update document_templates set nome = 'Declaração de Residência'                 where codigo = '10';
update document_templates set nome = 'Declaração de Separação'                  where codigo = '11';
update document_templates set nome = 'Declaração de Inatividade MEI'            where codigo = '12';
update document_templates set nome = 'Declaração de Separação de Fato (INSS)'  where codigo = '13';
update document_templates set nome = 'Termo de Representação (INSS)'            where codigo = '14';
update document_templates set nome = 'Termo de Responsabilidade'                where codigo = '15';

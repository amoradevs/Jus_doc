-- JusDoc — Seed inicial
-- Executar APÓS o schema.sql no SQL Editor do Supabase
-- Acesso: https://supabase.com/dashboard/project/oemumlmszlklpbgkwhbs/editor
-- Login: gestao@escritorio.com / Senha: admin123

-- Tenant
insert into tenants (id, nome)
values ('00000000-0000-0000-0000-000000000001', 'Escritório Lidiane & Alcione')
on conflict do nothing;

-- Usuário (bcrypt hash de "admin123", custo 12)
insert into users (tenant_id, email, senha_hash, nome)
values (
  '00000000-0000-0000-0000-000000000001',
  'gestao@escritorio.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiGvM5BxNBEi',
  'Lidiane Rocha Abreu'
)
on conflict (email) do nothing;

-- Configurações iniciais do escritório (vazias, preencher no app)
insert into office_settings (tenant_id)
values ('00000000-0000-0000-0000-000000000001')
on conflict do nothing;

-- 15 templates de documentos
insert into document_templates (codigo, nome, familia, formato, caminho_arquivo, campos_contextuais_necessarios) values
('01', 'Contrato BPC — Adulto Pleno',             'contrato',   'docx', 'templates/01_contrato_bpc_adulto.docx',              '[]'),
('02', 'Contrato BPC — A Rogo',                   'contrato',   'docx', 'templates/02_contrato_bpc_a_rogo.docx',              '["testemunhas"]'),
('03', 'Contrato BPC — Menor (< 16 anos)',        'contrato',   'docx', 'templates/03_contrato_bpc_menor_16.docx',            '["representante_legal"]'),
('04', 'Contrato BPC — Menor (16 a 18 anos)',     'contrato',   'docx', 'templates/04_contrato_bpc_menor_16_a_18.docx',       '["representante_legal"]'),
('05', 'Procuração BPC — Adulto Pleno',           'procuracao', 'docx', 'templates/05_procuracao_bpc_adulto.docx',            '[]'),
('06', 'Procuração BPC — Menor (< 16 anos)',      'procuracao', 'docx', 'templates/06_procuracao_bpc_menor_16.docx',          '["representante_legal"]'),
('07', 'Procuração BPC — (16 a 18 anos)',         'procuracao', 'docx', 'templates/07_procuracao_bpc_16_a_18.docx',           '["representante_legal"]'),
('08', 'Procuração — Mandado de Segurança',       'procuracao', 'docx', 'templates/08_procuracao_mandado_seguranca.docx',     '[]'),
('09', 'Declaração de Hipossuficiência',          'declaracao', 'docx', 'templates/09_declaracao_hipossuficiencia.docx',      '[]'),
('10', 'Declaração de Residência',                'declaracao', 'docx', 'templates/10_declaracao_residencia.docx',            '["filho_dependente","imovel"]'),
('11', 'Declaração de Separação',                 'declaracao', 'docx', 'templates/11_declaracao_separacao.docx',             '["conjuge"]'),
('12', 'Declaração de Inatividade MEI',           'declaracao', 'docx', 'templates/12_declaracao_inatividade_mei.docx',       '["empresa_mei"]'),
('13', 'Declaração de Separação de Fato (INSS)',  'declaracao', 'pdf',  'templates/13_declaracao_separacao_fato_inss.pdf',    '["conjuge"]'),
('14', 'Termo de Representação (INSS)',           'termo',      'pdf',  'templates/14_termo_representacao_inss.pdf',          '[]'),
('15', 'Termo de Responsabilidade (INSS)',        'termo',      'pdf',  'templates/15_termo_responsabilidade_inss.pdf',        '[]')
on conflict (codigo) do nothing;

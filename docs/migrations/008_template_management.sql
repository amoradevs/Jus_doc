-- JusDoc — Migração 002: Gestão de Templates e Documentos Rascunho
-- Executar no SQL Editor do Supabase: https://supabase.com/dashboard/project/oemumlmszlklpbgkwhbs/editor

-- 1. Rastreamento de edição em document_templates
ALTER TABLE document_templates
  ADD COLUMN IF NOT EXISTS editado_em  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS editado_por TEXT,
  ADD COLUMN IF NOT EXISTS storage_path TEXT;
-- storage_path: caminho no Supabase Storage (ex: templates/01_contrato.docx)
-- NULL = arquivo local (templates existentes), preenchido = arquivo em storage

-- 2. Tabela de documentos gerados/rascunhos por cliente
CREATE TABLE IF NOT EXISTS client_documents (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID        NOT NULL REFERENCES tenants(id),
  client_id       UUID        NOT NULL REFERENCES clients(id),
  template_codigo TEXT        NOT NULL,
  template_nome   TEXT        NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'RASCUNHO'
                              CHECK (status IN ('RASCUNHO', 'FINALIZADO')),
  conteudo_html   TEXT,       -- snapshot HTML editável (modo revisão)
  package_id      UUID        REFERENCES generation_packages(id),
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Índices úteis
CREATE INDEX IF NOT EXISTS idx_client_documents_client  ON client_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_client_documents_tenant  ON client_documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_client_documents_status  ON client_documents(status);

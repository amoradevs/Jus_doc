# Guia de Setup

## Pré-requisitos

- Node.js 18+
- Conta no Supabase (free tier) — projeto: `oemumlmszlklpbgkwhbs`
- Conta no Vercel (free tier)
- Vercel CLI (`npm i -g vercel`)

## 1. Clone e instale dependências

```bash
git clone https://github.com/amoradevs/Jus_doc.git
cd Jus_doc
npm install
```

## 2. Configure variáveis de ambiente

```bash
cp .env.local.example .env.local
```

Edite `.env.local` com suas credenciais:

| Variável | Onde obter |
|----------|-----------|
| `NEXTAUTH_SECRET` | Rode `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` em dev · URL do Vercel em prod |
| `SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `SUPABASE_SERVICE_KEY` | Supabase → Project Settings → API → `service_role` key |
| `SUPABASE_STORAGE_BUCKET` | `documentos-gerados` |
| `PDF_CONVERTER_API_KEY` | CloudConvert → API Keys (para conversão .docx→.pdf) |
| `GROQ_API_KEY` | groq.com → API Keys (para a agente Ali) |

> **Não existe `DATABASE_URL`.** O banco é acessado diretamente via `supabase-js` usando `SUPABASE_URL` + `SUPABASE_SERVICE_KEY`.

## 3. Configure o banco de dados (uma única vez)

Abra o SQL Editor do Supabase:
```
https://supabase.com/dashboard/project/oemumlmszlklpbgkwhbs/editor
```

Execute na ordem:

**Passo 3a — Criar tabelas (schema base):**
Cole e execute `docs/schema.sql`

**Passo 3b — Popular dados iniciais:**
Cole e execute `docs/seed.sql`

Isso cria:
- 1 tenant (Escritório Rocha & Alencar)
- 1 usuária: `gestao@escritorio.com` / `admin123`
- 15 templates de documentos
- Configurações iniciais do escritório (vazias)

**Passo 3c — Migrações incrementais:**
Execute os arquivos em `docs/migrations/` em ordem numérica:

```
001_add_pedido_campos.sql
002_add_tipo_pedido.sql
003_case_documents.sql
004_pipeline_e_cliente_exemplo.sql
005_add_telefone.sql
006_add_agenda_campos.sql
007_add_descricao_evento.sql
008_template_management.sql   ← gestão de templates e rascunhos
```

## 4. Crie os buckets de storage

No Supabase → Storage → New Bucket, crie dois buckets:

| Bucket | Visibilidade | Limite | Uso |
|--------|-------------|--------|-----|
| `documentos-gerados` | Privado | 50 MB | ZIPs gerados para download |
| `templates` | Privado | 10 MB | Arquivos DOCX dos templates |

## 5. Adicione os templates

**Opção A — Arquivos locais (deploy via código):**
Coloque os `.docx` na pasta `templates/` conforme o catálogo em `templates/README.md`.

**Opção B — Upload via sistema (recomendado):**
Após o login, vá em **Configurações → Templates** e faça upload direto pela interface.
Os arquivos são armazenados no bucket `templates` do Supabase Storage.

## 6. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:3000

Login: `gestao@escritorio.com` / `admin123`

## 7. Primeira configuração obrigatória

Após o login, vá em **Configurações** e preencha os dados do escritório antes de gerar qualquer documento. A geração é bloqueada enquanto esses dados estiverem vazios.

## Deploy na Vercel

```bash
vercel --prod
```

Configure as mesmas variáveis de ambiente no painel da Vercel (Project → Settings → Environment Variables). O `NEXTAUTH_URL` deve ser a URL de produção.

**URL de produção atual:** https://jus-doc-eta.vercel.app

## Variáveis no Vercel (estado atual)

| Variável | Status |
|----------|--------|
| `NEXTAUTH_SECRET` | ✅ Configurada |
| `NEXTAUTH_URL` | ✅ Configurada |
| `SUPABASE_URL` | ✅ Configurada |
| `SUPABASE_SERVICE_KEY` | ✅ Configurada |
| `GROQ_API_KEY` | ✅ Configurada |
| `PDF_CONVERTER_API_KEY` | ✅ Configurada |
| `CRON_SECRET` | ⏳ Pendente |

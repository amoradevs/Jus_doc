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

> **Não existe `DATABASE_URL`.** O banco é acessado diretamente via `supabase-js` usando `SUPABASE_URL` + `SUPABASE_SERVICE_KEY`.

## 3. Configure o banco de dados (uma única vez)

Abra o SQL Editor do Supabase:
```
https://supabase.com/dashboard/project/oemumlmszlklpbgkwhbs/editor
```

Execute na ordem:

**Passo 3a — Criar tabelas:**
Cole e execute o conteúdo de `docs/schema.sql`

**Passo 3b — Popular dados iniciais:**
Cole e execute o conteúdo de `docs/seed.sql`

Isso cria:
- 1 tenant (Escritório Lidiane & Alcione)
- 1 usuária: `lidiane@escritorio.com` / `admin123`
- 15 templates de documentos
- Configurações iniciais do escritório (vazias)

## 4. Crie o bucket de storage

No Supabase → Storage → New Bucket:
- **Nome:** `documentos-gerados`
- **Visibilidade:** privado (todos os toggles desligados)

## 5. Adicione os templates

Coloque os arquivos `.docx` e `.pdf` na pasta `templates/` conforme o catálogo em `templates/README.md`.

## 6. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:3000

Login: `lidiane@escritorio.com` / `admin123`

## 7. Primeira configuração obrigatória

Após o login, vá em **Configurações** e preencha os dados do escritório antes de gerar qualquer documento. A geração é bloqueada enquanto esses dados estiverem vazios.

## Deploy na Vercel

```bash
vercel --prod
```

Configure as mesmas variáveis de ambiente no painel da Vercel (Project → Settings → Environment Variables). O `NEXTAUTH_URL` deve ser a URL de produção (ex: `https://jus-doc-eta.vercel.app`).

**URL de produção atual:** https://jus-doc-eta.vercel.app

## Variáveis no Vercel (estado atual)

| Variável | Status |
|----------|--------|
| `NEXTAUTH_SECRET` | ✅ Configurada |
| `NEXTAUTH_URL` | ✅ Configurada |
| `SUPABASE_URL` | ✅ Configurada |
| `SUPABASE_SERVICE_KEY` | ✅ Configurada |
| `PDF_CONVERTER_API_KEY` | ⏳ Pendente |
| `CRON_SECRET` | ⏳ Pendente |

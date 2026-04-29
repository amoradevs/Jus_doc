# Guia de Setup

## Pré-requisitos

- Node.js 18+
- Conta no Supabase (free tier)
- Conta no Vercel (free tier)
- GitHub CLI (`gh`)

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
| `DATABASE_URL` | Supabase → Project Settings → Database → Connection string |
| `NEXTAUTH_SECRET` | Rode `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` em dev |
| `SUPABASE_URL` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_KEY` | Supabase → Project Settings → API → service_role |
| `SUPABASE_STORAGE_BUCKET` | `documentos-gerados` (criar o bucket no Supabase) |
| `PDF_CONVERTER_API_KEY` | CloudConvert → API Keys |

## 3. Configure o banco de dados

```bash
npm run db:generate   # gera migrations a partir do schema
npm run db:migrate    # aplica migrations no banco
npm run db:seed       # popula tenant, usuário padrão e 15 templates
```

**Usuário padrão criado pelo seed:**
- Email: `lidiane@escritorio.com`
- Senha: `admin123` (troque na primeira entrada)

## 4. Adicione os templates

Coloque os arquivos `.docx` e `.pdf` na pasta `templates/` conforme o catálogo em `templates/README.md`.

## 5. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:3000

## 6. Primeira configuração obrigatória

Após o login, vá em **Configurações** e preencha os dados do escritório antes de gerar qualquer documento.

## Deploy na Vercel

```bash
vercel --prod
```

Configure as mesmas variáveis de ambiente no painel da Vercel (Settings → Environment Variables).

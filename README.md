# JusDoc

Plataforma de automação documental para advocacia previdenciária.

A advogada cadastra clientes e gera pacotes de documentos jurídicos preenchidos automaticamente, escolhendo livremente entre 15 templates (contratos, procurações, declarações e formulários INSS).

**Deploy em produção:** https://www.gestorali.com.br

## Stack

- **Framework:** Next.js 16 + App Router + TypeScript strict
- **UI:** Tailwind CSS + shadcn/ui · paleta rose/mauve minimalista
- **Forms:** react-hook-form + zod
- **Banco:** PostgreSQL via Supabase + supabase-js v2 (sem Drizzle ORM)
- **Auth:** NextAuth.js v5 (email/senha, JWT)
- **Storage:** Supabase Storage (bucket `documentos-gerados`)
- **Geração .docx:** docxtemplater
- **Conversão PDF:** CloudConvert API
- **Overlay PDF (INSS):** pdf-lib
- **CEP:** ViaCEP

## Início rápido

```bash
cp .env.local.example .env.local  # preencha as variáveis (ver docs/guides/setup.md)
npm install
npm run dev
```

Antes de iniciar, execute `docs/schema.sql` e `docs/seed.sql` no SQL Editor do Supabase (uma única vez).

Acesse: http://localhost:3000

**Usuário padrão:** `lidiane@escritorio.com` / `admin123`

## Documentação

| Documento | Descrição |
|-----------|-----------|
| [docs/guides/setup.md](docs/guides/setup.md) | Guia completo de instalação e deploy |
| [docs/guides/cep-autocomplete.md](docs/guides/cep-autocomplete.md) | Como funciona o auto-complete de CEP |
| [docs/guides/document-generation.md](docs/guides/document-generation.md) | Fluxo de geração de documentos |
| [docs/architecture/stack.md](docs/architecture/stack.md) | Decisões de arquitetura |
| [docs/schema.sql](docs/schema.sql) | Schema completo do banco (executar no Supabase) |
| [docs/seed.sql](docs/seed.sql) | Dados iniciais: tenant, usuário e 15 templates |
| [templates/README.md](templates/README.md) | Catálogo dos 15 templates e contrato de variáveis |

## Scripts

```bash
npm run dev          # servidor de desenvolvimento (http://localhost:3000)
npm run build        # build de produção
npm run typecheck    # verificação de tipos TypeScript
npm run lint         # ESLint
vercel --prod        # deploy em produção
```

> Não há scripts `db:generate`, `db:migrate` ou `db:seed` — o banco é configurado
> diretamente via SQL Editor do Supabase (ver `docs/schema.sql` e `docs/seed.sql`).

## Módulos

| Módulo | Descrição |
|--------|-----------|
| **Clientes** | Cadastro e edição com CEP auto-complete via ViaCEP |
| **Pipeline** | Kanban de processos por etapa (Triagem → Concedido) |
| **Geração documental** | 15 templates — contratos, procurações, formulários INSS |
| **Prazos** | Controle de prazos por processo com alertas de vencimento |
| **Planejamento Previdenciário** | Motor EC 103/2019 — 5 regras de transição, projeção de aposentadoria, geração de .docx |
| **Ali** | Agente de IA especializada em BPC/LOAS e Direito Previdenciário |
| **Configurações** | Dados do escritório, gestão de templates via upload |

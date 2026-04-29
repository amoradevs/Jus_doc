# JusDoc

Plataforma de automação documental para advocacia previdenciária.

A advogada cadastra clientes e gera pacotes de documentos jurídicos preenchidos automaticamente, escolhendo livremente entre 15 templates (contratos, procurações, declarações e formulários INSS).

## Stack

- **Framework:** Next.js 16 + App Router + TypeScript strict
- **UI:** Tailwind CSS + shadcn/ui
- **Forms:** react-hook-form + zod
- **Banco:** PostgreSQL via Supabase + Drizzle ORM
- **Auth:** NextAuth.js v5 (email/senha)
- **Storage:** Supabase Storage
- **Geração .docx:** docxtemplater
- **Conversão PDF:** CloudConvert API
- **Overlay PDF (INSS):** pdf-lib
- **CEP:** ViaCEP

## Início rápido

```bash
cp .env.local.example .env.local  # preencha as variáveis
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Acesse: http://localhost:3000

**Usuário padrão:** `lidiane@escritorio.com` / `admin123`

## Documentação

| Documento | Descrição |
|-----------|-----------|
| [docs/guides/setup.md](docs/guides/setup.md) | Guia completo de instalação e deploy |
| [docs/guides/cep-autocomplete.md](docs/guides/cep-autocomplete.md) | Como funciona o auto-complete de CEP |
| [docs/guides/document-generation.md](docs/guides/document-generation.md) | Fluxo de geração de documentos |
| [docs/architecture/stack.md](docs/architecture/stack.md) | Decisões de arquitetura |
| [templates/README.md](templates/README.md) | Catálogo dos 15 templates e contrato de variáveis |
| [IMPLEMENTATION-PLAN.md](IMPLEMENTATION-PLAN.md) | Plano de implementação em 14 tasks |

## Scripts

```bash
npm run dev          # servidor de desenvolvimento (http://localhost:3000)
npm run build        # build de produção
npm run typecheck    # verificação de tipos TypeScript
npm run lint         # ESLint
npm run db:generate  # gerar migrations a partir do schema
npm run db:migrate   # aplicar migrations no banco
npm run db:seed      # popular banco com dados iniciais
```

## Escopo do MVP

- Cadastro e edição de clientes com dados completos
- CEP auto-complete via ViaCEP
- Seleção livre dos 15 templates (sem kits fixos)
- Preenchimento progressivo de campos contextuais
- Geração de pacote ZIP com todos os PDFs
- Histórico de pacotes gerados (download por 30 dias)
- Configurações do escritório (dados das advogadas)

**Fora do MVP:** WhatsApp, e-mail, assinatura digital, editor de templates, analytics.

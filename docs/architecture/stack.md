# Arquitetura e Stack

## Decisões de stack (fechadas para o MVP)

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Framework | Next.js 16 + App Router + TypeScript strict | SSR, rotas de API, tipagem completa |
| UI | Tailwind CSS + shadcn/ui | Componentes acessíveis, design system coeso |
| Design | Paleta rose/mauve (CSS custom properties) | Identidade visual feminina e profissional |
| Forms | react-hook-form + zod | Validação declarativa, performance |
| Banco | PostgreSQL via Supabase (free tier) | Managed, free tier suficiente para MVP |
| Cliente DB | supabase-js v2 (sem Drizzle ORM) | Queries diretas via REST, sem migration tooling |
| Autenticação | NextAuth.js v5 (Auth.js) + Credentials | Simples, sem OAuth de terceiros |
| Storage | Supabase Storage (bucket: `documentos-gerados`) | Integrado com o banco, free tier |
| Geração .docx | docxtemplater (Node) | Sem subprocess Python se compatível |
| Conversão PDF | CloudConvert API (tier gratuito) | 25 conv/dia, suficiente para MVP single-user |
| Overlay PDF | pdf-lib | Puro Node, sem dependências externas |
| ZIP | jszip | Amplamente testado |
| CEP | ViaCEP (https://viacep.com.br) | Gratuito, sem chave de API |
| Validações | Algoritmos locais (CPF mod-11, CNPJ mod-11) | Sem dependência externa |
| Deploy | Vercel (front + API) + Supabase (DB + storage) | Free tiers suficientes para MVP |

## Por que supabase-js em vez de Drizzle ORM

Drizzle ORM exige `DATABASE_URL` com senha do banco — credencial que é redefinida pelo Supabase a cada reset de senha e que não está acessível no painel sem ação manual. O supabase-js usa `SUPABASE_URL` + `SUPABASE_SERVICE_KEY`, ambas disponíveis imediatamente no painel de API. Para o escopo de 1 tenant/1 usuária do MVP, o cliente REST é suficiente e elimina a camada de migrations.

## Setup do banco de dados

O schema é versionado em `docs/schema.sql` e `docs/seed.sql`. Ambos são executados **uma única vez** no SQL Editor do Supabase, sem nenhum comando local.

```
https://supabase.com/dashboard/project/oemumlmszlklpbgkwhbs/editor
```

## Modelo de dados

O schema segue arquitetura **multi-tenant desde o dia 1**, mesmo que o MVP tenha apenas 1 usuária. O campo `tenant_id` está em todas as tabelas e **nunca deve ser omitido nas queries**.

### Tabelas

```
tenants                     → escritórios (multi-tenancy)
users                       → advogadas (com tenant_id)
office_settings             → dados do escritório (1 por tenant)
clients                     → clientes cadastrados
client_contextual_data      → dados contextuais (JSONB por grupo)
document_templates          → catálogo dos 15 templates
generation_packages         → histórico de geração (ZIP)
generated_documents         → documentos individuais dentro de um package
```

## Fluxo de geração de documentos

```
Selecionar templates
    ↓
Calcular campos contextuais necessários (união dos templates selecionados)
    ↓
Verificar quais já estão preenchidos no cliente
    ↓
Solicitar apenas os campos faltantes
    ↓
Para cada template:
    .docx → renderizar com docxtemplater → converter para .pdf via CloudConvert
    .pdf  → overlay de texto com pdf-lib
    ↓
Empacotar em ZIP
    ↓
Upload no Supabase Storage
    ↓
Registrar em generation_packages + generated_documents
    ↓
Disponibilizar para download (30 dias)
```

## Design system

A paleta de cores é definida via CSS custom properties em `app/globals.css` e mapeada para Tailwind v4 via `@theme inline`. As classes Tailwind (`bg-primary`, `text-muted-foreground`, etc.) usam automaticamente esses tokens.

| Token | Valor | Uso |
|-------|-------|-----|
| `--primary` | `#A6668A` | Botões, ícones, links ativos, foco |
| `--background` | `#FAF8F9` | Fundo geral (creme quente) |
| `--card` | `#FFFFFF` | Superfície de cards |
| `--secondary` | `#F5EDF3` | Hover, fundos secundários |
| `--muted-foreground` | `#9E8DA6` | Texto de apoio |
| `--foreground` | `#2B1D2A` | Texto principal (roxo escuro) |
| `--border` | `#E7DCE4` | Bordas e divisores |
| `--destructive` | `#C05A60` | Erros e ações destrutivas |

# Arquitetura e Stack

## Decisões de stack (fechadas para o MVP)

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Framework | Next.js 16 + App Router + TypeScript strict | SSR, rotas de API, tipagem completa |
| UI | Tailwind CSS + shadcn/ui | Componentes acessíveis, design system coeso |
| Forms | react-hook-form + zod | Validação declarativa, performance |
| Banco | PostgreSQL via Supabase (free tier) | Managed, free tier suficiente para MVP |
| ORM | Drizzle ORM | Tipagem nativa, migrations simples |
| Autenticação | NextAuth.js v5 (Auth.js) + Credentials | Simples, sem OAuth de terceiros |
| Storage | Supabase Storage | Integrado com o banco, free tier |
| Geração .docx | docxtemplater (Node) | Sem subprocess Python se compatível |
| Conversão PDF | CloudConvert API (tier gratuito) | 25 conv/dia, suficiente para MVP single-user |
| Overlay PDF | pdf-lib | Puro Node, sem dependências externas |
| ZIP | jszip | Amplamente testado |
| CEP | ViaCEP (https://viacep.com.br) | Gratuito, sem chave de API |
| Validações | Algoritmos locais (CPF mod-11, CNPJ mod-11) | Sem dependência externa |
| Deploy | Vercel (front + API) + Supabase (DB + storage) | Free tiers suficientes para MVP |

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

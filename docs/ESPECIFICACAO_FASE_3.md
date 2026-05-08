# Sistema Rocha & Alencar — Especificação da Fase 3

## Para o Claude Code

Este documento especifica as próximas evoluções do sistema. Leia integralmente antes de propor qualquer alteração. Algumas seções descrevem o que **já existe e deve ser preservado** — respeitar isso é tão importante quanto implementar o que falta.

A Fase 3 é composta por dois grandes blocos de trabalho:

**Bloco A** — Refatoração da interface Cliente x Processo (preparação estrutural).

**Bloco B** — Tracker de Prazos Processuais integrado ao Pipeline (feature principal).

A ordem importa. Bloco A precisa estar concluído antes do Bloco B começar, porque o tracker de prazos vai operar sobre a entidade Processo refatorada.

---

## 1. Estado atual do sistema (preservar)

Antes de mexer em qualquer coisa, entenda o que está bem feito e não deve ser tocado.

### 1.1 Estrutura de navegação

Menu superior fixo com cinco itens visíveis: logo R&A, Clientes, Pipeline, Contagem de Prazo, Ferramentas. À direita, controles de tamanho de fonte (A-, A+), modo escuro/claro, e avatar do usuário com menu Configurações/Sair. **Manter exatamente como está.**

### 1.2 Identidade visual

Paleta bordô (#6B2C39 e variações), tipografia limpa (provavelmente Inter ou similar), cards brancos com sombra sutil, badges arredondados para status. **Não alterar tokens de design.** Toda nova tela deve seguir o mesmo sistema visual.

### 1.3 Telas funcionais a preservar integralmente

A home pós-login com saudação personalizada, KPIs do mês (Novos clientes, Em andamento, Deferidos, Indeferidos), Clientes Recentes e Agenda da Semana. Está bem resolvida.

A listagem de Clientes (`/clientes`) com busca, filtros por status, ordenação, ações Abrir/Editar. Mantém estrutura. A única alteração necessária está no Bloco A (ver seção 3).

O Pipeline Kanban (`/pipeline`) com 8 colunas (Triagem → Consulta → Documentos → Aguardando INSS → Perícia → Judicial → Concedido → Encerrado), cards com nome do cliente, tipo de benefício, próximo evento com data, progresso documental (X/Y, Z%), data de última movimentação. Drag-and-drop funcional. **Estrutura excelente, manter intacta.** As adições da Fase 3 estendem o card sem reescrevê-lo.

A Contagem de Prazo (`/contagem-prazo`) com wizard de 4 passos para Planejamento Previdenciário EC 103/2019. **Não tocar.** É calculadora de planejamento, escopo distinto do tracker de prazos da Fase 3.

A tela de Ferramentas (`/ferramentas`) com Compressor de PDF e E-mail Temporário. Manter.

A tela de Configurações do Escritório (`/configuracoes`) com dados das advogadas (Lidiane Rocha Abreu e Alcione Ferreira Gomes Alencar), OABs, e-mails, endereço. Esses dados alimentam todos os templates. Manter.

A tela de Templates (`/configuracoes/templates`) com os 7 templates já cadastrados (contrato_honorarios, procuracao, declaracao_hipossuficiencia, declaracao_residencia, termo_representacao_inss, declaracao_separacao, declaracao_inatividade_mei). Manter.

### 1.4 Arquitetura de dados existente

Pelo que se vê nas telas, o sistema já possui as entidades Cliente, Processo (implícito), e Documento. A relação Cliente → Processo aparenta ser 1:1 hoje. A Fase 3 vai explicitar essa relação como 1:N, sem quebrar dados existentes.

---

## 2. Bloco A — Refatoração da interface Cliente x Processo

### 2.1 Diagnóstico do problema

Hoje, na listagem `/clientes`, cada linha mostra "Status" do cliente com valores como "Em andamento" ou "Deferido". Isso funciona enquanto cada cliente tem exatamente um processo no sistema. No momento em que o primeiro cliente recorrente aparecer (ex: Renata Aparecida, hoje "Deferida" em Aposentadoria por Tempo de Contribuição, contratar novo serviço para BPC do filho), a interface não saberá onde encaixar o segundo processo.

A entidade Cliente está, na interface, carregando atributos da entidade Processo. Precisa ser desacoplado.

### 2.2 Decisão de UI

Cliente continua sendo a entidade-pessoa permanente. Processo é a entidade-caso, vinculada a um cliente, com seus próprios atributos (tipo de benefício, status, data de entrada, etapa no pipeline, prazos). Um cliente pode ter zero, um, ou múltiplos processos.

Visualmente, a refatoração se materializa em três pontos:

**Listagem `/clientes`** deixa de mostrar "Status". A coluna "Status" é substituída por "Processos" — número de processos ativos (badge com contador) e tipo do mais recente. Cliente sem processo aparece com badge "Sem processo ativo" em cinza. Cliente com 1 processo mostra o tipo + status. Cliente com 2+ mostra "3 processos" com indicador colorido (verde se algum deferido, amarelo se algum em exigência, vermelho se algum indeferido).

**Tela de detalhe do cliente** (presumivelmente já existe ou é acessada via "Abrir") deve passar a ter uma aba ou seção "Processos" listando todos os processos vinculados, cada um com link para sua própria página de detalhe. Botão "+ Novo processo" no topo dessa seção.

**Tela de detalhe do processo** (nova, ou refinamento da existente) é onde toda a operação acontece: pipeline, prazos, documentos gerados, andamentos, observações. Cliente vira contexto (header com nome, CPF, telefone), processo vira protagonista.

### 2.3 Mudanças no banco de dados

Se ainda não existe, criar a tabela `processos`:

| Campo | Tipo | Observações |
|-------|------|-------------|
| id | uuid PK | |
| cliente_id | uuid FK | índice obrigatório |
| numero_interno | string | gerado: ANO-SEQUENCIAL (ex: 2026-0042) |
| tipo_beneficio | enum | aposentadoria_idade_urbana, aposentadoria_idade_rural, aposentadoria_tempo_contribuicao, bpc_idoso, bpc_deficiente_adulto, bpc_deficiente_menor_16, bpc_deficiente_16_18, mandado_seguranca, pensao_morte, auxilio_doenca |
| etapa_pipeline | enum | triagem, consulta, documentos, aguardando_inss, pericia, judicial, concedido, encerrado |
| status_resultado | enum | em_andamento, exigencia, deferido, indeferido, recurso_administrativo, judicializado, arquivado |
| numero_protocolo_inss | string | nullable |
| numero_processo_judicial | string | nullable |
| data_entrada | date | data de início do atendimento |
| dib_pleiteada | date | nullable, data de início do benefício pleiteada |
| created_at, updated_at | timestamp | |

Migração de dados existentes: para cada cliente que hoje tem campos como tipo_beneficio e status na tabela clientes, criar um registro correspondente em processos com os mesmos valores, e zerar/remover esses campos da tabela clientes (deixar só dados de pessoa).

### 2.4 Critérios de aceite do Bloco A

A listagem de clientes mostra "Processos" em vez de "Status".

Clicar em "Abrir" leva à tela de detalhe do cliente, que lista todos os processos vinculados.

Cada processo tem sua própria URL (`/processos/{numero_interno}`) e tela de detalhe.

Nenhum dado existente foi perdido na migração — todos os 5 clientes atuais mantêm seus processos com mesmo tipo, mesmo status, mesma posição no Kanban.

O Pipeline Kanban continua funcionando exatamente como antes, mas agora os cards representam Processos (não Clientes), e arrastar entre colunas atualiza o `etapa_pipeline` do processo, não do cliente.

---

## 3. Bloco B — Tracker de Prazos Processuais

### 3.1 Conceito

Hoje, os cards do Pipeline mostram "Evento · 5 mai" e "Audiência · 12 mai" como informações soltas. Não há estrutura por trás disso, não há alerta de proximidade, não há integração com a agenda da home. O Bloco B transforma esses textos avulsos em **prazos estruturados** com tipo, data, status e ações.

Não criar tela nova de prazos. O tracker vive **dentro** do detalhe de cada processo, e os alertas afloram em três pontos da UI já existentes: cards do Pipeline, agenda da home, e badge global no header.

### 3.2 Modelo de dados

Criar a tabela `prazos`:

| Campo | Tipo | Observações |
|-------|------|-------------|
| id | uuid PK | |
| processo_id | uuid FK | índice obrigatório |
| categoria | enum | administrativo_inss, judicial, comercial_interno, evento |
| tipo | string | "Resposta a exigência", "Recurso ao CRPS", "Contestação", "Audiência", "Perícia", "Retorno ao cliente" |
| descricao | text | detalhamento livre |
| data_inicio | date | quando o prazo começou a contar |
| data_limite | date | data fatal |
| dias_uteis | boolean | true para prazos judiciais (CPC), false para corridos |
| status | enum | pendente, cumprido, perdido, cancelado |
| data_cumprimento | date | nullable, preenchido quando status = cumprido |
| anotacao_cumprimento | text | nullable, o que foi feito |
| created_at, updated_at | timestamp | |

A categoria define cor e prioridade visual. Sugestão:

- `administrativo_inss` → vermelho (#C2410C ou similar). Prazo fatal do INSS.
- `judicial` → roxo profundo (#5B21B6). Prazo do CPC.
- `comercial_interno` → âmbar (#B45309). Compromisso interno.
- `evento` → azul neutro (#1E40AF). Audiência, perícia, reunião — não é "prazo a cumprir", é "data a comparecer".

### 3.3 Onde os prazos aparecem

**Card do Pipeline (refinamento do existente)**: o card hoje mostra um único "Evento · data". Deve passar a mostrar até dois itens: o próximo prazo categorizado por cor (badge colorida pequena) e o evento mais próximo. Se houver prazo vencendo em ≤ 3 dias, o card ganha uma borda esquerda colorida (sangrando da cor da categoria). Se houver prazo vencido não cumprido, o card ganha um ícone de alerta (⚠) à esquerda do nome.

**Agenda da Home (refinamento do existente)**: hoje mostra eventos da semana corrente. Deve passar a mostrar tanto eventos quanto prazos, diferenciados por cor. Cada item clicável leva ao detalhe do processo correspondente.

**Header global (novo)**: ao lado do avatar do usuário, um sino (bell icon) com badge de contagem mostra quantos prazos estão vencendo nas próximas 48 horas. Clicar abre dropdown com lista priorizada.

**Tela de detalhe do processo (nova ou refinada)**: aba ou seção "Prazos" com lista completa do processo, ordenada por data limite ascendente, com filtros por status (pendente, cumprido, perdido). Botão "+ Novo prazo" abre modal de cadastro.

### 3.4 Lógica de proximidade e alertas

A semântica visual de proximidade segue esta escala:

| Distância | Tratamento visual |
|-----------|------------------|
| Mais de 7 dias | Texto normal, cor padrão |
| 4 a 7 dias | Texto na cor da categoria, peso 500 |
| 1 a 3 dias | Borda colorida no card + texto bold |
| Hoje | Card destacado, fundo levemente tingido da cor da categoria |
| Vencido pendente | Ícone ⚠ + texto vermelho independente da categoria |

Para prazos com `dias_uteis = true`, a contagem **exclui** sábados, domingos e feriados nacionais. Implementar via biblioteca como `date-fns-business` ou similar. Considerar feriados forenses (ex: 20 de dezembro a 20 de janeiro do ano seguinte é recesso forense, contagem suspensa).

### 3.5 Cadastro de prazos

Modal acessível pelo botão "+ Novo prazo" na tela de detalhe do processo. Campos:

- Categoria (radio com 4 opções, com descrição curta de cada)
- Tipo (combobox com sugestões pré-cadastradas por categoria, mas aceita texto livre)
- Data limite (date picker)
- Contagem em dias úteis? (checkbox, default true se categoria for judicial)
- Descrição (textarea opcional)
- Botão "Salvar prazo"

Tipos pré-cadastrados sugeridos por categoria:

**Administrativo INSS**: Resposta a exigência (30 dias corridos), Recurso ao CRPS (30 dias corridos), Recurso ao Conselho de Recursos (30 dias corridos).

**Judicial**: Contestação (15 dias úteis), Manifestação sobre laudo pericial (15 dias úteis), Apelação (15 dias úteis), Embargos de declaração (5 dias úteis), Réplica (15 dias úteis), Audiência de instrução (data marcada).

**Comercial interno**: Retorno ao cliente, Atualização de andamento, Follow-up, Reunião agendada.

**Evento**: Audiência, Perícia médica, Perícia social, Reunião com cliente.

### 3.6 Cumprimento e fechamento de prazo

Em cada prazo pendente da lista, dois botões: "Marcar como cumprido" (abre mini-modal pedindo data e anotação opcional) e "Cancelar" (com confirmação).

Quando marcado como cumprido, o prazo sai da lista de "vencendo" mas fica visível em filtro "Cumpridos" na tela do processo, para histórico e auditoria.

Quando o prazo passa da data limite sem ser cumprido, status automaticamente vira "perdido" e o card no Pipeline ganha o ícone ⚠ até ser arquivado manualmente. Não esconder do usuário — prazo perdido é informação operacional crítica.

### 3.7 Integração com a agenda existente

Hoje a agenda da home mostra eventos avulsos. Após o Bloco B, ela passa a ler de duas fontes: os eventos antigos (manter compatibilidade) e os prazos com categoria `evento` da nova tabela. Visualmente, os itens da agenda ganham o pequeno marcador colorido por categoria.

### 3.8 Notificações (escopo mínimo nesta fase)

Notificação ativa fora do sistema (e-mail, WhatsApp, push) **fica para fase posterior**. Nesta fase, todo alerta vive dentro do sistema:

- Badge de contagem no sino do header (atualiza a cada carregamento de tela ou polling de 5min)
- Destaque visual nos cards do Pipeline
- Item destacado na agenda da home

Isso é deliberado. Notificação externa exige integração com provedor (SendGrid, Twilio, Z-API), opt-in granular, gestão de preferências, controle de spam. Não é trabalho da Fase 3. Nesta fase, garantimos que **quando a advogada abre o sistema, ela enxerga o que precisa fazer**. Suficiente para o escopo atual.

### 3.9 Critérios de aceite do Bloco B

Cadastro de prazo funcional, com as 4 categorias e cálculo correto de dias úteis quando aplicável.

Tela de detalhe do processo lista todos os prazos do processo, ordenados por data limite, com filtros funcionando.

Card do Pipeline mostra próximo prazo categorizado por cor e ícone de alerta se houver prazo perdido.

Agenda da home mostra eventos e prazos com marcadores coloridos.

Sino no header mostra contagem de prazos vencendo em 48 horas.

Cumprimento e cancelamento de prazo funcionam, com histórico preservado.

Prazo judicial em dias úteis exclui fins de semana e feriados nacionais corretamente.

---

## 4. Ordem de implementação e validação

Recomendo subdividir em sessões com o Claude Code da seguinte forma. Não pular etapas.

**Sessão 1** — Leitura e diagnóstico. Pedir ao Claude Code para ler este documento, navegar pelo código atual, e produzir um relatório do que existe versus o que precisa ser criado. Sem código nesta sessão.

**Sessão 2** — Migration e modelo de dados do Bloco A. Criar tabela `processos`, migrar dados existentes, manter tabela `clientes` apenas com dados de pessoa.

**Sessão 3** — Refatoração da listagem de clientes e tela de detalhe. Mostrar processos como sub-entidades do cliente.

**Sessão 4** — Tela de detalhe do processo. URL própria, contexto do cliente no header, abas internas (Resumo, Documentos, Prazos — esta última fica preparada mas vazia até a sessão 6).

**Sessão 5** — Tabela `prazos` e cadastro/listagem básica. Sem integração visual ainda.

**Sessão 6** — Integração visual nos cards do Pipeline, agenda da home, e sino do header.

**Sessão 7** — Lógica de dias úteis e feriados, cálculo correto de proximidade.

**Sessão 8** — Polimento: testes dos critérios de aceite, ajustes finos de cor e espaçamento.

Cada sessão termina com critério de aceite verificável. Não passar para a próxima sem que a anterior esteja validada.

---

## 5. Restrições de design e implementação

### 5.1 Não fazer

Não criar nova tela "Prazos" no menu superior. Tracker vive dentro de processo.

Não mexer na "Contagem de Prazo" existente. É calculadora de planejamento, não tracker.

Não criar cores novas. Usar a paleta existente do sistema (bordô da marca, mais as 4 cores de categoria de prazo definidas em 3.2).

Não introduzir biblioteca de componentes nova. Usar o que já está em uso no sistema (Tailwind, shadcn/ui, ou o que estiver implementado).

Não criar dependência circular entre Cliente e Processo. Cliente não conhece seus processos diretamente — query reverso via FK.

Não armazenar prazo como string de texto livre nos cards. Prazo é entidade estruturada com tipo, data, categoria.

### 5.2 Fazer

Manter o Pipeline Kanban como está estruturalmente. Apenas estender os cards com informação de prazo, sem reescrever a lógica de drag-and-drop.

Reutilizar o sistema de modal/dialog que já existe nas telas de cadastro de cliente.

Garantir que o cadastro do prazo, marcação de cumprido e cancelamento sejam ações com no máximo 3 cliques.

Documentar feriados nacionais em arquivo de configuração — não hardcoded em código. Permite que as advogadas adicionem feriados estaduais ou recessos especiais.

Versionar todas as alterações de status de prazo (auditoria). Quando um prazo é marcado como cumprido, registrar em log quem marcou, quando, e qual a anotação.

---

## 6. Resumo executivo para o desenvolvedor

A Fase 3 tem dois objetivos: separar conceitualmente Cliente de Processo na interface (Bloco A), e adicionar tracker estruturado de prazos integrado ao Pipeline existente (Bloco B). Ordem é estrita — Bloco A primeiro.

O sistema atual está bem construído e a maior parte das telas deve ser preservada. As intervenções são cirúrgicas, não fundacionais. Onde houver dúvida entre construir novo e estender o existente, sempre estender.

O critério de sucesso é simples: ao final da Fase 3, a advogada abre o sistema de manhã, olha a home, e em 30 segundos sabe três coisas — quais clientes têm prazo vencendo hoje, quais processos estão travados, e o que precisa ser feito antes do final do dia. Tudo isso sem clicar em mais de duas telas.

Tudo o mais é detalhe técnico a serviço desse objetivo.

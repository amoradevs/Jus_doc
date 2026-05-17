# Manual de Uso — GestorAli
**Rocha & Alencar Advocacia**

> Acesse o sistema em: **[www.gestorali.com.br](https://www.gestorali.com.br)**

---

## Sumário

1. [Acesso ao sistema](#1-acesso-ao-sistema)
2. [Dashboard — Visão geral](#2-dashboard--visão-geral)
3. [Clientes](#3-clientes)
4. [Pipeline de Processos](#4-pipeline-de-processos)
5. [Planejamento Previdenciário](#5-planejamento-previdenciário)
6. [Geração de Documentos](#6-geração-de-documentos)
7. [Controle de Prazos](#7-controle-de-prazos)
8. [Ali — Consultora Jurídica IA](#8-ali--consultora-jurídica-ia)
9. [Ferramentas](#9-ferramentas)
10. [Configurações](#10-configurações)

---

## 1. Acesso ao sistema

Acesse **[www.gestorali.com.br](https://www.gestorali.com.br)** em qualquer navegador — funciona também no celular.

Na tela de login, informe seu e-mail e senha cadastrados. O sistema salva sua sessão automaticamente, então não é necessário fazer login a cada acesso no mesmo dispositivo.

---

## 2. Dashboard — Visão geral

A página inicial exibe um resumo do escritório:

- **Total de clientes** cadastrados
- **Processos ativos** em andamento
- **Processos deferidos** e **indeferidos**
- **Últimos clientes** cadastrados (acesso rápido ao perfil)
- **Calendário semanal** com audiências e eventos agendados

Use o filtro de **mês/ano** no canto superior direito para ver as métricas de um período específico.

---

## 3. Clientes

### 3.1 Lista de clientes

Acesse pelo menu **Clientes**. A lista mostra todos os clientes cadastrados com nome, CPF, cidade e status dos processos.

**Para encontrar um cliente:**
- Digite o nome ou CPF na barra de busca
- Use os filtros para refinar por status de processo (deferido, indeferido, em andamento), cidade ou ordenação

**Ações disponíveis em cada cliente:**
- **Abrir** — abre o perfil completo
- **Editar** — altera os dados cadastrais
- **Exportar** — baixa a lista completa em planilha (botão no topo da página)

### 3.2 Cadastrar novo cliente

1. Clique em **+ Novo cliente** (canto superior direito)
2. Preencha os dados pessoais:
   - Nome completo, CPF, data de nascimento, sexo, estado civil
   - Telefone e e-mail
   - Endereço — digite o CEP e os campos de rua, bairro e cidade são preenchidos automaticamente
   - Senha de cadastro INSS (opcional)
3. Clique em **Salvar**

### 3.3 Perfil do cliente

O perfil reúne tudo sobre o cliente em uma única tela:

- **Dados pessoais** — informações cadastrais completas
- **Processos** — lista de processos vinculados, com etapa e status
- **Checklist de documentos** — controle de quais documentos foram entregues
- **Pacotes gerados** — histórico de documentos gerados para esse cliente

#### Checklist de documentos

O checklist organiza os documentos por categoria. Para cada item:
- Clique no checkbox para marcar como **recebido**
- Adicione uma observação se necessário
- Clique em **+ Adicionar documento** para incluir um item que não estava na lista

Quando todos os obrigatórios estiverem marcados, o sistema indica que o dossiê está completo.

---

## 4. Pipeline de Processos

Acesse pelo menu **Pipeline**. Esta é a visão kanban do escritório — cada coluna representa uma etapa do processo.

### Etapas do pipeline

| Etapa | Descrição |
|-------|-----------|
| **Triagem** | Primeiro contato, avaliação inicial |
| **Consulta** | Consulta jurídica agendada ou em andamento |
| **Documentos** | Aguardando documentação do cliente |
| **Aguardando INSS** | Processo protocolado, aguardando resposta |
| **Perícia** | Perícia médica agendada ou realizada |
| **Judicial** | Processo em fase judicial |
| **Concedido** | Benefício deferido |
| **Encerrado** | Processo finalizado (oculto por padrão) |

### Mover um processo de etapa

- **No computador:** arraste o card da coluna atual para a coluna desejada
- **No celular:** toque nos três pontos do card e selecione **Mover para**

### Informações no card

Cada card exibe:
- Nome do cliente e número interno do processo
- Tipo de benefício (BPC, Aposentadoria por Idade, etc.)
- Status atual (Em andamento, Deferido, Indeferido, etc.)
- Próximo prazo e se já está vencido
- Progresso do checklist de documentos

### Processos encerrados

Clique em **Ver encerrados** para exibir os processos finalizados. Eles ficam ocultos por padrão para não poluir a visualização.

---

## 5. Planejamento Previdenciário

Acesse pelo menu **Planejamento**. Esta ferramenta calcula a melhor data de aposentadoria pelas regras de transição da EC 103/2019.

### Como usar

**Passo 1 — Selecionar o segurado**

Digite o nome ou CPF na caixa de busca. Se o cliente estiver cadastrado no sistema, os dados são preenchidos automaticamente. Caso contrário, preencha manualmente.

**Passo 2 — Dados do segurado**

Confirme ou preencha:
- Nome completo, CPF, data de nascimento, sexo
- **DER** — Data de Entrada do Requerimento (data do pedido no INSS)
- Marque se o segurado era filiado ao RGPS antes de 13/11/2019 (necessário para as regras de transição)

**Passo 3 — Períodos contributivos (CNIS)**

Informe os períodos de contribuição conforme o CNIS:
- Data de início e fim de cada vínculo
- Regime: RGPS (CLT/Autônomo), RPPS (Servidor Público) ou Facultativo
- Clique em **+ Adicionar período** para incluir mais vínculos

**Passo 4 — Salários de contribuição**

Informe os salários de contribuição para calcular o valor estimado do benefício.
- Se não tiver os salários em mãos, marque **Pular — não calcular benefício agora**

**Passo 5 — Resultado**

O sistema exibe:

- **Tempo contributivo total** calculado até a DER
- **Melhor data de aposentadoria** — a regra que permite se aposentar mais cedo
- **Cards de cada regra de transição:**
  - Sistema de Pontos (Art. 15)
  - Idade Progressiva (Art. 16)
  - Pedágio 50% (Art. 17)
  - Aposentadoria por Idade (Art. 18)
  - Pedágio 100% (Art. 20)
- **Benefício estimado** — salário de benefício, coeficiente e valor mensal projetado
- Regras inelegíveis ficam no acordeão **"Regras analisadas e não aplicáveis"**

### Gerar documento

No resultado, clique em:
- **Baixar planejamento completo** — documento Word (.docx) detalhado para o arquivo do processo
- **Baixar e-mail resumido** — versão simplificada para enviar ao segurado

---

## 6. Geração de Documentos

A geração de documentos é acessada pelo **perfil do cliente**.

### Como gerar um pacote — pela trilha guiada

1. Abra o perfil do cliente
2. Clique em **Gerar documentos**
3. Escolha o tipo de benefício (BPC/LOAS, Aposentadoria por Idade, Pensão por Morte, etc.)
4. Selecione o perfil do segurado (adulto, menor, com representante, etc.)
5. Marque as situações específicas do caso:
   - **Imóvel de terceiro** — ao marcar, um campo aparece para informar o nome do proprietário do imóvel. O nome é incluído automaticamente na Declaração de Residência.
   - **MEI inativo** — gera Declaração de Inatividade de Empresa
   - **Separado de fato** — gera Declaração de Separação de Fato
   - **Há representação legal** — gera Termo de Responsabilidade
6. Revise os documentos sugeridos — pode marcar/desmarcar individualmente
7. Se o pacote incluir o **Termo de Representação INSS**, um modal pergunta qual advogada assina o termo e se deve incluir a assinatura digital
8. Clique em **Gerar** e aguarde

O sistema gera todos os documentos selecionados preenchidos com os dados do cliente e disponibiliza para download em ZIP.

### Como gerar um pacote — pela busca rápida

Use a barra de busca no topo da tela de geração para encontrar um documento específico pelo nome. Selecione um ou mais documentos e clique em **Gerar Documento**.

> O comportamento é idêntico ao da trilha guiada — se o Termo de Representação INSS estiver selecionado, o modal de advogada aparece igualmente.

### Documentos disponíveis

O escritório tem 15 templates configurados, incluindo:
- Contratos de honorários (adulto, menor, BPC, MS)
- Procuração (sempre com as duas advogadas)
- Declarações: Hipossuficiência, Residência, Separação de Fato, Inatividade MEI
- Formulários INSS: Termo de Representação e Autorização, Termo de Responsabilidade

### Checkboxes nos documentos

Os formulários do INSS (Termo de Representação, Termo de Responsabilidade) usam o padrão **(X)** em negrito para itens marcados e **( )** para desmarcados — compatível com impressão e leitores de PDF.

### Histórico de pacotes

No perfil do cliente, a seção **Pacotes gerados** lista todos os documentos já gerados, com data e link para download. Os arquivos ficam disponíveis por 30 dias.

---

## 7. Controle de Prazos

Os prazos são gerenciados dentro de cada processo. Para acessar, abra um processo pelo Pipeline.

### Adicionar um prazo

1. Na aba **Prazos** do processo, clique em **+ Novo prazo**
2. Selecione a categoria (Recurso, Audiência, Exigência, etc.)
3. Escolha o tipo específico — o sistema sugere os tipos mais comuns para cada categoria
4. Informe a data de início e a quantidade de dias (corridos ou úteis)
5. O sistema calcula a data limite automaticamente
6. Salve

### Acompanhar prazos

Cada prazo exibe:
- **Dias restantes** — em verde (tranquilo), amarelo (atenção) ou vermelho (urgente/vencido)
- **Status:** Pendente, Cumprido, Perdido ou Cancelado

### Notificações

O **sino** no canto superior direito exibe prazos urgentes de todos os processos — aqueles com vencimento em até 3 dias ou já vencidos. As notificações atualizam automaticamente a cada 5 minutos.

### Cumprir ou cancelar um prazo

- Clique em **Cumprir** para registrar que o prazo foi atendido (pode adicionar uma anotação)
- Clique em **Cancelar** para desativar o prazo sem cumpri-lo

---

## 8. Ali — Consultora Jurídica IA

A **Ali** é uma assistente de inteligência artificial especializada em BPC/LOAS e Direito Previdenciário. Ela fica disponível em todas as páginas do sistema.

### Como acessar

Clique no ícone da Ali no canto inferior direito da tela.

### O que você pode perguntar

- Requisitos para concessão de BPC/LOAS
- Jurisprudência recente sobre benefícios previdenciários
- Prazos legais e procedimentos administrativos
- Dúvidas sobre regras de transição da EC 103/2019
- Orientações sobre recursos e impugnações

### Dicas de uso

- Seja específico na pergunta — informe o tipo de benefício, a situação do segurado e o que precisa saber
- Clique no ícone de copiar ao lado de cada resposta para salvar o texto
- A Ali não tem acesso aos dados dos clientes cadastrados — as respostas são baseadas na legislação e jurisprudência

---

## 9. Ferramentas

Acesse pelo menu **Ferramentas**. Utilitários de uso rápido:

### Compressor de PDF

Reduz o tamanho de arquivos PDF sem perda significativa de qualidade. Útil para envio por e-mail ou upload em sistemas do INSS com limite de tamanho.

1. Clique em **Selecionar arquivo** ou arraste o PDF
2. Aguarde o processamento
3. Baixe o arquivo comprimido

### E-mail temporário

Gera um endereço de e-mail temporário para cadastros em sites sem expor o e-mail profissional. O endereço expira automaticamente após uso.

---

## 10. Configurações

Acesse pelo menu superior (ícone do usuário ou link **Configurações**).

### Dados do escritório

Mantenha os dados atualizados — eles são usados automaticamente nos documentos gerados:

- Nome do escritório e das advogadas
- Número da OAB
- Endereço completo
- Telefone e e-mail de contato

Clique em **Salvar** após qualquer alteração.

### Templates de documentos

Em **Configurações → Templates**, você pode:

- Ver todos os templates ativos
- Fazer upload de novos templates (.docx)
- Editar templates existentes usando o **Template Wizard** (assistente com IA)
- Ativar ou desativar templates

**Para adicionar um novo template:**
1. Clique em **+ Novo template**
2. Faça upload do arquivo .docx
3. O sistema identifica os campos e sugere as variáveis automaticamente
4. Revise e salve

---

## Dicas gerais

**No celular:** o sistema é totalmente funcional no celular. Use o menu de navegação na parte superior. No Pipeline, deslize horizontalmente para ver todas as etapas.

**Busca rápida:** na lista de clientes, a busca funciona tanto pelo nome quanto pelo CPF (com ou sem pontuação).

**Documentos gerados:** sempre revise os dados do segurado antes de gerar documentos. Se algum campo estiver desatualizado, edite o cadastro do cliente primeiro.

**Segurança:** não compartilhe seu login. Cada advogada deve ter seu próprio acesso. Em caso de dúvidas sobre acesso, entre em contato com a administradora do sistema.

---

*Manual atualizado em maio de 2026 — GestorAli v1.3*
*Sistema desenvolvido para Rocha & Alencar Advocacia*

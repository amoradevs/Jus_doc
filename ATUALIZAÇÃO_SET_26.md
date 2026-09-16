# Atualização — Setembro/2026

**Data:** 2026-09-16

---

## Visão geral

- **Ajuste 1** — Modal "Aposentadoria Urbana ou Rural?" passa a permitir seleção múltipla (checkboxes) em vez de única (radio)
- **Ajuste 2** — Novo benefício "Aposentadoria por Tempo de Contribuição" adicionado ao wizard
- **Ajuste 3** — Bloco de assinatura "a rogo" corrigido em 3 documentos (Contrato, Procuração, Declaração de Hipossuficiência): validador da digital agora aparece corretamente
- **Ajuste 4** — Auditoria do fluxo "a rogo": corrigido alerta/resumo ausente no Passo 4 do wizard e corrigido RG aparecendo sem valor no Termo de Representação INSS
- **Ajuste 5** — Assinatura da Dra. Alcione (imagem) incluída no Termo de Representação INSS quando ela é a signatária selecionada

---

## Ajuste 1 — Modalidade de Aposentadoria por Idade: seleção múltipla (Urbana + Rural)

### Problema
No wizard de geração de documentos, ao escolher o benefício "Aposentadoria por Idade", o modal "Aposentadoria Urbana ou Rural?" só permitia marcar uma modalidade por vez (radio button). Na prática, a aposentadoria pode ser urbana, rural, ou urbana **e** rural (regime misto) — e o Termo de Representação INSS precisa refletir isso, com as duas caixas pintadas quando aplicável.

### Solução
- Modal convertido de seleção única (radio) para seleção múltipla (checkboxes independentes) — dá para marcar Urbana, Rural, ou as duas.
- Botão "Confirmar" só habilita com pelo menos uma modalidade marcada.
- Card do wizard exibe "— urbana e rural" quando ambas selecionadas.
- Motor de geração de documentos (`template-context.ts`) ganhou uma nova entrada de benefício `aposentadoria_idade_urbana_rural`, que marca os três checkboxes correspondentes no Termo de Representação INSS (`aposentadoria_idade`, `aposentadoria_idade_urbana`, `aposentadoria_idade_rural`) e ajusta a descrição/objeto do documento para "APOSENTADORIA POR IDADE URBANA E RURAL".

### Arquivos modificados
- `components/cenario-wizard/step-beneficio.tsx` — modal com checkboxes multi-seleção (ícone `Check`, `aria-pressed`), texto de resumo no card, validação de mínimo 1 seleção
- `components/cenario-wizard/wizard-cenario.tsx` — estado `aposentadoriaModalidade` migrado de `'urbana' | 'rural' | null` para `('urbana' | 'rural')[]`
- `lib/document-generation/cadeia-documental.ts` — tipo `Cenario.aposentadoria_idade_modalidade` migrado para array
- `lib/document-generation/template-context.ts` — nova entrada `aposentadoria_idade_urbana_rural` no mapa de benefícios; lógica de resolução da chave do benefício cobre 0, 1 ou 2 modalidades selecionadas

### Validação
`npm run typecheck` passou sem erros. Teste manual recomendado: gerar o Termo de Representação INSS com Urbana + Rural marcados e conferir se as duas caixas saem pintadas no PDF.

---

## Ajuste 2 — Novo benefício: Aposentadoria por Tempo de Contribuição

### Problema
O sistema só tinha "Aposentadoria por Idade" no Passo 1 (Benefício) do wizard. A advogada solicitou incluir também "Aposentadoria por Tempo de Contribuição" — mesmas perguntas e mesma cadeia de documentos da Aposentadoria por Idade; muda apenas o texto/contexto nos documentos gerados (onde constava "aposentadoria por idade" passa a constar "aposentadoria por tempo de contribuição") e, no Termo de Representação INSS, a caixa pintada é a de "Aposentadoria por Tempo de Contribuição" (item II do formulário) em vez da de "Aposentadoria por Idade" (item I).

### Solução
- Novo card "Aposentadoria por Tempo de Contribuição" no Passo 1 do wizard, logo abaixo de "Aposentadoria por Idade" (ícone `CalendarClock`). Sem modal de Urbana/Rural — essa distinção não se aplica a este benefício.
- Novo `BeneficioId` (`aposentadoria_tempo`) adicionado ao motor de cadeia documental (`cadeia-documental.ts`) com a mesma cadeia de documentos e gatilhos da Aposentadoria por Idade (contrato, procuração, Termo INSS, hipossuficiência, e os módulos de imóvel de terceiro / separação de fato / MEI inativo).
- `template-context.ts` ganhou a entrada de benefício `aposentadoria_tempo`, com descrição/objeto próprios ("BENEFÍCIO DE APOSENTADORIA POR TEMPO DE CONTRIBUIÇÃO") e marcação do checkbox `aposentadoria_tempo` — que já existia no renderer do Termo INSS (`render-termo-representacao-inss.ts`, item II do formulário), então nenhuma mudança foi necessária ali.

### Arquivos modificados
- `components/cenario-wizard/step-beneficio.tsx` — novo card de benefício
- `components/cenario-wizard/step-gatilhos.tsx` — gatilhos "Imóvel de terceiro" e "MEI inativo" passam a se aplicar também a este benefício
- `lib/document-generation/cadeia-documental.ts` — novo `BeneficioId`; catálogo de templates atualizado para incluir o novo benefício onde "Aposentadoria por Idade" já se aplicava
- `lib/document-generation/template-context.ts` — nova entrada no mapa de benefícios

### Validação
`npm run typecheck` e a suíte de testes (`npx vitest run`) passaram sem regressões novas — as 10 falhas pré-existentes em `cadeia-documental.test.ts` já ocorriam antes desta mudança (testes desatualizados em relação a `validarCoerencia`, não relacionados a este ajuste). Teste manual recomendado: gerar o pacote completo escolhendo "Aposentadoria por Tempo de Contribuição" e conferir que os documentos saem com o texto correto e que o Termo INSS pinta o item II.

---

## Ajuste 3 — Perfil "a rogo": bloco de assinatura corrigido em 3 documentos (BPC e demais benefícios)

### Problema
O perfil "a rogo" (cliente que não sabe/não pode assinar, precisa de um validador da digital + 2 testemunhas) já estava totalmente ativo no wizard — o modal que coleta os dados do validador e das testemunhas já existia e funcionava, idêntico ao especificado no documento de referência do Gestor Amparis (`docs/A_ROGO.md`). O problema estava no **conteúdo dos arquivos .docx** de produção (hospedados no Supabase Storage, bucket `templates`):

- **01 — Contrato de Honorários** e **02 — Procuração**: mostravam as testemunhas, mas nunca referenciavam o validador da digital — quem valida a assinatura do cliente nunca aparecia no documento. RG aparecia mesmo quando vazio.
- **03 — Declaração de Hipossuficiência**: bloco quebrado — rotulava cada testemunha como "A ROGO: [nome]" (usando um campo legado fixo), nunca mostrava o validador, sem condicional de RG, sem data de nascimento.
- **05 — Termo de Representação INSS** e **06 — Declaração de Separação de Fato** já estavam corretos (o 06, em especial, serviu de referência do padrão certo dentro do próprio jus-doc).

### Solução
Reconstruído o bloco de assinatura a rogo nos 3 documentos (01, 02, 03), seguindo exatamente o padrão do Gestor Amparis: nome do cliente → `A ROGO: {validador.nome_completo}` → RG do validador (condicional, só aparece se preenchido) → CPF do validador → label "Testemunhas:" → tabela de 2 colunas lado a lado, uma por testemunha, cada uma com linha de assinatura (espaço reservado via `w:before="1440"` na célula — técnica necessária porque Word/LibreOffice ignoram espaçamento `w:after` no parágrafo anterior a uma tabela), nome, RG condicional, CPF e data de nascimento.

Escopo combinado com a Dra.: só os 3 documentos sempre presentes no pacote BPC (01, 02, 03) nesta rodada. Declaração de Residência, Inatividade MEI e Termo de Responsabilidade (que hoje não têm bloco a rogo nenhum, só mostram o nome do cliente) ficaram fora — são documentos modulares, ativados só em situações específicas.

### Arquivos afetados
- `templates` bucket no Supabase Storage (produção): `templates/01_01_contrato_honorarios.docx`, `templates/02_02_procuracao.docx`, `templates/03_03_declaracao_hipossuficiencia.docx` — sobrescritos com a versão corrigida
- Nenhum arquivo de código-fonte foi alterado (o `TemplateContext` já expunha todos os campos necessários — `validador`, `testemunhas[]`, `tem_rg`)
- Backup dos 3 arquivos originais guardado localmente antes da substituição

### Validação
Editei o XML dos 3 `.docx` (unzip → edição → rezip), confirmei que continuam arquivos válidos, e testei o render real com `renderDocxTemplate` (o mesmo código usado em produção) simulando um cenário BPC + a rogo com uma testemunha com RG e outra sem, e o validador com e sem RG — em todos os casos o resultado saiu correto, sem chaves `{...}` sobrando. Recomendo um teste manual pelo wizard (BPC → perfil a rogo → preencher validador/testemunhas → gerar pacote) para conferir visualmente o PDF/DOCX final.

---

## Ajuste 4 — Auditoria do fluxo "a rogo": alerta do Passo 4 e RG aparecendo em branco

### Contexto
Pedido de auditoria profunda no fluxo "a rogo" após o Ajuste 3, com foco em UX/UI, e uma reclamação específica da cliente: o RG continuava aparecendo (a palavra "RG" sem número) mesmo quando o cliente não tinha RG cadastrado.

### Achado 1 — Passo 4 (Confirmação) nunca mostrava o resumo do validador/testemunhas
O componente `step-confirmacao.tsx` já tinha a UI pronta para mostrar, no Passo 4, um card "Testemunha 1: [nome] · Testemunha 2: [nome]" com botão "Editar" quando o perfil é a rogo — mas esse card **nunca aparecia**, porque o alerta que o dispara (`AROGO_CONFIRMAR_TESTEMUNHAS`) nunca era gerado pelo motor (`validarCoerencia()` em `cadeia-documental.ts` só gerava `REPRESENTACAO_LEGAL_GATILHO_AUSENTE`). Havia inclusive um teste automatizado (`cadeia-documental.test.ts`) já escrito esperando esse alerta, mas a implementação nunca foi feita — o teste estava falhando silenciosamente.

**Correção:** adicionado o alerta `AROGO_CONFIRMAR_TESTEMUNHAS` (nível aviso, campo relacionado `perfil`) em `validarCoerencia()` sempre que o perfil for `a_rogo`. Isso restaura o resumo visual com botão Editar no Passo 4, e volta a exigir confirmação explícita (dialog "Há avisos que merecem atenção") antes de gerar o pacote. Dois testes que já existiam para esse cenário voltaram a passar.

### Achado 2 — RG aparecendo em branco no Termo de Representação INSS (documento principal)
No renderer PDF do Termo de Representação INSS (`render-termo-representacao-inss.ts`), a linha de identificação do cliente montava o texto com `RG nº ${cl.rg || ''}` — **sem condicional nenhuma**. Diferente do validador e das testemunhas (que já usavam `if (v.rg)` / `if (t1.rg)` corretamente), o RG do próprio cliente sempre aparecia no texto: *"...inscrito(a) no CPF nº 000.000.000-00, RG nº , residente..."* — com "RG nº" pendurado sem valor sempre que o cliente não tinha RG cadastrado. Esse é o documento que sai para **todo** cliente BPC (e demais benefícios, exceto Mandado de Segurança) — por isso a reclamação apareceu rápido.

**Correção:** o trecho ", RG nº {valor}" só é incluído no texto quando o RG está de fato preenchido (mesmo padrão condicional já usado para validador/testemunhas no mesmo arquivo).

### Achado 3 — blindagem contra RG "preenchido só com espaço"
Os campos `cliente.rg` e `representante.rg` em `template-context.ts` eram passados direto do banco sem `.trim()` — um RG salvo como só espaços em branco passaria pelos condicionais `{#cliente.rg}`/`{#representante.rg}` dos `.docx` como se estivesse preenchido (string não-vazia = verdadeiro). `validador.rg` e `testemunhas[].rg` já tinham essa proteção (campo `tem_rg` calculado com `.trim()`); agora `cliente.rg` e `representante.rg` recebem o mesmo tratamento na fonte, cobrindo todos os documentos de uma vez.

### Outras verificações da auditoria (sem problemas encontrados)
- Modal "A rogo" (`step-perfil.tsx`) abre corretamente ao avançar com esse perfil selecionado, pré-preenche com dados salvos, valida nome+CPF obrigatórios (RG opcional) e data de nascimento obrigatória para testemunhas, e o foco automático vai para o campo correto (nome do validador) — o bug de foco indo para testemunha 1 em vez do validador (que aconteceu no gestor_amparis) não existe aqui.
- Cancelar o modal sem salvar não deixa dados "sujos": reabrir sempre recarrega a partir dos últimos dados salvos.
- Wiring completo entre `wizard-cenario.tsx` → `step-perfil.tsx` (dados de validador/testemunhas) e → `step-confirmacao.tsx` (resumo + botão Editar) confirmado.
- RG condicional nos documentos 04 (Declaração de Residência), 06 (Separação de Fato) e 15 (Termo de Responsabilidade) já estava correto antes desta auditoria.

### Fora do escopo (encontrado, não alterado)
A auditoria também expôs um conjunto pré-existente de testes automatizados (`SEPARADO_FATO_FORA_BPC`, `MS_GRATUIDADE_JUSTICA`, exclusividade do documento 03 para BPC) que descrevem regras de negócio nunca implementadas em `validarCoerencia()`/`CATALOGO_TEMPLATES` — não relacionadas ao fluxo a rogo. Não mexi nisso agora; fica registrado para decisão futura.

### Arquivos afetados
- `lib/document-generation/cadeia-documental.ts` — novo alerta `AROGO_CONFIRMAR_TESTEMUNHAS`
- `lib/document-generation/render-termo-representacao-inss.ts` — RG do cliente agora condicional
- `lib/document-generation/template-context.ts` — `cliente.rg` e `representante.rg` agora passam por `.trim()`

### Validação
`npm run typecheck` e `npx vitest run` sem regressões novas (48 passando, as mesmas 8 falhas pré-existentes e não relacionadas). Testei manualmente a lógica de RG condicional (vazio, preenchido e só-espaço) e o render completo dos 3 documentos corrigidos no Ajuste 3.

---

## Ajuste 5 — Assinatura da Dra. Alcione no Termo de Representação INSS

### Problema
O sistema já permite escolher qual advogada assina o Termo de Representação INSS quando há duas cadastradas (modal no Passo 4). Mas só a Dra. Lidiane tinha uma imagem de assinatura (`templates/assinaturas/lidiane.png`) — ao selecionar a Dra. Alcione, o documento saía só com nome e OAB em texto, sem a imagem da assinatura.

### Solução
A Dra. Larissa enviou uma foto da assinatura da Dra. Alcione (papel fotografado). Processei a imagem (removi o fundo do papel, deixei transparente, recortei e ajustei para o mesmo padrão da imagem da Dra. Lidiane — PNG 600×170 com fundo transparente) e salvei em `templates/assinaturas/alcione.png`. Adicionei o campo `adv2_assinatura_path` ao `TemplateContext` e atualizei o renderer do Termo INSS (`render-termo-representacao-inss.ts`) para desenhar a imagem certa conforme a advogada selecionada (`apenas_alcione`).

Confirmei no banco (Supabase) que a Dra. Alcione já está cadastrada como advogada parceira (`Alcione Ferreira Gomes Alencar`, OAB 218550-SP) — o modal de seleção já funcionava, só faltava a imagem.

### Arquivos afetados
- `templates/assinaturas/alcione.png` — nova imagem de assinatura (processada a partir da foto enviada)
- `lib/document-generation/template-context.ts` — novo campo `escritorio.adv2_assinatura_path`
- `lib/document-generation/render-termo-representacao-inss.ts` — desenha a imagem da advogada correta conforme quem assina

### Validação
`npm run typecheck` passou sem erros. Testei o render real do PDF com a Dra. Alcione selecionada como signatária — a imagem aparece corretamente acima da linha de assinatura, junto com nome e OAB, no mesmo padrão visual da Dra. Lidiane.

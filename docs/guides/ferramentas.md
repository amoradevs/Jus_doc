# Guia: Módulo de Ferramentas

A aba **Ferramentas** (`/ferramentas`) concentra utilitários para a rotina do escritório.

## Compressor de PDF

Reduz o tamanho de arquivos PDF para envio ao Meu INSS e sistemas de tribunais.

### Como usar

1. Acesse **Ferramentas** na navegação principal
2. No card **Compressor de PDF**, arraste o arquivo ou clique para selecionar
3. Clique em **Comprimir PDF**
4. Aguarde o processamento (barra de progresso)
5. Clique em **Baixar PDF comprimido** — o card exibe o tamanho original, o novo tamanho e a taxa de redução

### Especificações

| Item | Detalhe |
|------|---------|
| Formatos aceitos | `.pdf` |
| Tamanho máximo | 50 MB |
| Serviço | CloudConvert (perfil `web`) |
| Privacidade | Arquivo deletado do CloudConvert após download |

### Variável de ambiente necessária

```
PDF_CONVERTER_API_KEY=<chave do CloudConvert>
```

Crie a chave em: **cloudconvert.com → Dashboard → API Keys**
Escopos necessários: `task.read` + `task.write`

> Enquanto a chave não estiver configurada, o endpoint retorna HTTP 503 com mensagem amigável na tela.

---

## E-mail Temporário

Gera um endereço de e-mail descartável para receber códigos de verificação sem usar a caixa oficial do escritório.

### Como usar

1. Acesse **Ferramentas** na navegação principal
2. No card **E-mail Temporário**, clique em **Gerar E-mail Temporário**
3. Copie o endereço gerado com o ícone ao lado
4. Cole o endereço no site externo onde precisa se cadastrar
5. A **Caixa de entrada** atualiza automaticamente a cada 7 segundos
6. Clique em um e-mail recebido para ler o corpo; clique em **Copiar tudo** para copiar o conteúdo

### Especificações

| Item | Detalhe |
|------|---------|
| Provedor | [mail.tm](https://mail.tm) (gratuito, sem chave de API) |
| Arquitetura | Client-side — chamadas diretas do browser ao mail.tm |
| Polling | A cada 7 segundos |
| Suporte | E-mails HTML e texto puro |
| Validade | O endereço existe enquanto a página estiver aberta |

> Não é necessária nenhuma variável de ambiente para esta funcionalidade.

---

## Estrutura de arquivos

```
app/(app)/ferramentas/
└── page.tsx                          # Página principal com os dois cards

app/api/ferramentas/
├── comprimir-pdf/
│   └── route.ts                      # POST — compressão via CloudConvert
└── temp-email/
    └── route.ts                      # Proxy reservado (não usado ativamente)

components/ferramentas/
├── pdf-compressor.tsx                # UI do compressor (drag & drop, resultado)
└── temp-email.tsx                    # UI do e-mail temporário (inbox, leitura)
```

# CEP Auto-complete

## Como funciona

Ao preencher o campo CEP em qualquer formulário de endereço (cliente ou escritório), o sistema busca automaticamente os dados de logradouro, bairro, cidade e UF via API do ViaCEP.

## Comportamento

1. Usuária digita o CEP (8 dígitos)
2. Ao sair do campo (evento `blur`), uma chamada é feita para `/api/cep/[cep]`
3. O servidor consulta `https://viacep.com.br/ws/{cep}/json/` com timeout de 3 segundos
4. **Sucesso:** logradouro, bairro, cidade e UF são preenchidos automaticamente
5. **Falha (CEP inválido, API fora do ar, timeout):** campos ficam habilitados para entrada manual — não bloqueia o fluxo

## Campos preenchidos automaticamente

| Campo do form | Resposta do ViaCEP |
|--------------|-------------------|
| Logradouro | `logradouro` |
| Bairro | `bairro` |
| Cidade | `localidade` |
| UF | `uf` |

O campo **número** e **complemento** nunca são preenchidos automaticamente — são sempre manuais.

## Rota de API

`GET /api/cep/[cep]`

- CEP é saneado (remove traço e espaços) antes da requisição
- Timeout: 3 segundos
- Retorno de sucesso: `{ logradouro, bairro, localidade, uf }`
- Retorno de erro: `{ error: 'CEP_NOT_FOUND' }` (HTTP 404)

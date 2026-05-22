# Atualização 22/05/2026 — Passo a passo para aplicar no sistema clonado

Todas as alterações desta sessão estão divididas em dois tipos:

- **Código** — alterações em arquivos `.ts` / `.tsx` que precisam ser aplicadas no repositório do sistema clonado
- **Storage** — edição direta de template no Supabase Storage do sistema clonado (não é código, é o arquivo `.docx` em produção)

---

## Parte 1 — Alterações de Código

São 5 arquivos alterados. Aplique cada um conforme descrito abaixo.

---

### 1. `lib/document-generation/cadeia-documental.ts`

**O que mudou:** Declaração de Hipossuficiência agora é incluída em **todos os tipos de ação**, não só BPC. O alerta manual para Mandado de Segurança foi removido.

**Como aplicar:**

Localize o bloco do código `03` e altere:

```ts
// ANTES
beneficios: ['bpc'],

// DEPOIS
beneficios: [], // [] = aplica-se a todos os benefícios
```

Também remova o bloco do alerta `MS_GRATUIDADE_JUSTICA` inteiro (dentro de `validarCoerencia`):

```ts
// REMOVER este bloco completo:
if (beneficio === 'mandado_seguranca') {
  alertas.push({
    nivel: 'info',
    codigo: 'MS_GRATUIDADE_JUSTICA',
    mensagem: 'Avalie se cabe pedido de gratuidade da justiça...',
    campo_relacionado: 'beneficio',
  });
}
```

---

### 2. `components/cenario-wizard/step-confirmacao.tsx`

**O que mudou:** Removido o toggle "Incluir assinatura digital da Dra. Lidiane". A assinatura agora é sempre incluída automaticamente.

**Como aplicar:**

**a)** Remova a linha do state:
```ts
// REMOVER:
const [incluirAssinaturaLidiane, setIncluirAssinaturaLidiane] = useState(true);
```

**b)** Remova a variável derivada (se existir):
```ts
// REMOVER:
const lidianeSelecionada = advogadasSelecionadas === 'lidiane';
```

**c)** No payload do fetch, altere:
```ts
// ANTES
incluir_assinatura_lidiane: incluirAssinaturaLidiane,

// DEPOIS
incluir_assinatura_lidiane: true,
```

**d)** Remova o bloco do checkbox no modal de seleção de advogada:
```tsx
// REMOVER este bloco completo:
{lidianeSelecionada && (
  <label ...>
    <Checkbox
      id="incluir-assinatura-lidiane"
      checked={incluirAssinaturaLidiane}
      onCheckedChange={(v) => setIncluirAssinaturaLidiane(!!v)}
      ...
    />
    <div>
      <p ...>Incluir assinatura digital da Dra. Lidiane</p>
    </div>
  </label>
)}
```

---

### 3. `lib/document-generation/package-builder.ts`

**O que mudou (2 alterações):**
- ZIP agora inclui PDF **e** DOCX de cada documento
- Processamento paralelo com `Promise.all` (performance)

**Como aplicar:**

**a) ZIP com DOCX** — no loop que processa templates, após `zip.file(nomeArquivo, fileBuffer)`, adicione:

```ts
zip.file(nomeArquivo, fileBuffer);
// ADICIONAR as 3 linhas abaixo:
if (docxBuffer && extensao === 'pdf') {
  zip.file(nomeArquivo.replace(/\.pdf$/, '.docx'), docxBuffer);
}
```

**b) Paralelização** — substitua o `for` loop de renderização por `Promise.all`. A mudança é grande; o mais seguro é copiar diretamente o arquivo completo do repositório atualizado.

---

### 4. `app/api/geracao/route.ts`

**O que mudou:** Adicionado `maxDuration = 60` para evitar timeout no Vercel ao gerar pacotes com múltiplos documentos.

**Como aplicar:**

Adicione esta linha antes da função `POST`:

```ts
export const maxDuration = 60;

export async function POST(req: Request) {
```

---

### 5. `components/cenario-wizard/step-gatilhos.tsx` + `wizard-cenario.tsx`

**O que mudou:** Para perfis de menor/incapaz, o gatilho "Há representação legal" agora é **obrigatório e travado** — não pode ser desmarcado. A opção "Nenhuma situação especial" fica oculta nesses perfis.

**Como aplicar:**

Esta alteração envolve lógica em dois arquivos interdependentes. O mais seguro é copiar os arquivos completos do repositório atualizado:

- `components/cenario-wizard/step-gatilhos.tsx`
- `components/cenario-wizard/wizard-cenario.tsx`

Se preferir aplicar manualmente, os pontos principais são:

**`wizard-cenario.tsx`** — na função `handleGatilhosChange`, garantir que `tem_representacao_legal` não seja removido para perfis de menor:
```ts
function handleGatilhosChange(g: GatilhoId[]) {
  const ehMenor = perfil !== null && PERFIS_MENORES.includes(perfil);
  const gatilhosFinais =
    ehMenor && !g.includes('tem_representacao_legal')
      ? [...g, 'tem_representacao_legal' as GatilhoId]
      : g;
  setGatilhos(gatilhosFinais);
  setPacote(null);
  setCodigosAtivos([]);
}
```

**`step-gatilhos.tsx`** — na função `toggle`, bloquear a desmarcação:
```ts
function toggle(gatilho: GatilhoId) {
  if (gatilho === 'tem_representacao_legal' && perfilEhMenor) return;
  // ... resto da função
}
```

---

## Parte 2 — Alteração no Supabase Storage

Esta parte **não é código** — é uma edição direta no arquivo `.docx` que está no Storage do Supabase do sistema clonado.

### Template: Declaração de Hipossuficiência

**O que mudou:** Removida a frase "e de minha família" do corpo do documento.

**Texto original:**
> "...sem prejuízo do meu próprio sustento **e de minha família**, sendo, pois..."

**Texto correto:**
> "...sem prejuízo do meu próprio sustento, sendo, pois..."

**Como aplicar:**

Execute o script abaixo substituindo as credenciais do sistema clonado:

```bash
# 1. Instalar dependências (se necessário)
pip3 install requests  # ou usar curl como no exemplo

# 2. Baixar o template do Storage do sistema clonado
curl -o /tmp/hipossuficiencia.docx \
  -H "Authorization: Bearer SEU_SERVICE_KEY" \
  -H "apikey: SEU_SERVICE_KEY" \
  "https://SEU_PROJETO.supabase.co/storage/v1/object/templates/templates/03_03_declaracao_hipossuficiencia.docx"

# 3. Editar com Python
python3 - <<'EOF'
import zipfile, shutil

src = '/tmp/hipossuficiencia.docx'
dst = '/tmp/hipossuficiencia_editado.docx'
shutil.copy2(src, dst)

with zipfile.ZipFile(src) as z:
    xml = z.read('word/document.xml').decode('utf-8')

assert ' e de minha família' in xml, "Frase não encontrada — verifique se o arquivo é o correto"

new_xml = xml.replace(' e de minha família', '', 1)

with zipfile.ZipFile(src) as zin:
    with zipfile.ZipFile(dst, 'w', zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            if item.filename == 'word/document.xml':
                zout.writestr(item, new_xml.encode('utf-8'))
            else:
                zout.writestr(item, zin.read(item.filename))

print("OK — arquivo salvo em", dst)
EOF

# 4. Re-upload para o Storage do sistema clonado
curl -X PUT \
  -H "Authorization: Bearer SEU_SERVICE_KEY" \
  -H "apikey: SEU_SERVICE_KEY" \
  -H "Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document" \
  -H "x-upsert: true" \
  --data-binary @/tmp/hipossuficiencia_editado.docx \
  "https://SEU_PROJETO.supabase.co/storage/v1/object/templates/templates/03_03_declaracao_hipossuficiencia.docx"
```

> **Atenção:** O nome do arquivo no Storage pode ser diferente no sistema clonado. Verifique na tabela `document_templates` o campo `storage_path` do template com código `03`.

---

## Resumo — Checklist

| # | Arquivo / Recurso | Tipo | Status |
|---|---|---|---|
| 1 | `lib/document-generation/cadeia-documental.ts` | Código | Aplicar manualmente |
| 2 | `components/cenario-wizard/step-confirmacao.tsx` | Código | Aplicar manualmente |
| 3 | `lib/document-generation/package-builder.ts` | Código | Copiar arquivo completo |
| 4 | `app/api/geracao/route.ts` | Código | Adicionar 1 linha |
| 5 | `components/cenario-wizard/step-gatilhos.tsx` | Código | Copiar arquivo completo |
| 6 | `components/cenario-wizard/wizard-cenario.tsx` | Código | Copiar arquivo completo |
| 7 | `03_03_declaracao_hipossuficiencia.docx` | Storage | Script Python acima |

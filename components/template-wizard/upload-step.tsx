'use client';

import { useRef, useState } from 'react';
import { Upload, FileText, Loader2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const FAMILIAS = [
  { value: 'contrato', label: 'Contrato' },
  { value: 'procuracao', label: 'Procuração' },
  { value: 'declaracao', label: 'Declaração' },
  { value: 'termo', label: 'Termo' },
  { value: 'outro', label: 'Outro' },
];

async function extractTagsFromDocx(file: File): Promise<string[]> {
  try {
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const xmlFile = zip.file('word/document.xml');
    if (!xmlFile) return [];
    const xml = await xmlFile.async('text');
    const stripped = xml.replace(/<[^>]+>/g, '');
    const matches = [...stripped.matchAll(/\{([^}]+)\}/g)];
    const unique = [...new Set(matches.map((m) => `{${m[1]}}`))]
    return unique;
  } catch {
    return [];
  }
}

function fileToNome(filename: string) {
  return filename
    .replace(/\.docx$/i, '')
    .split(/(\s+|-)/)
    .map((part) =>
      part.trim().length > 0
        ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
        : part
    )
    .join('');
}

type Props = {
  proximoCodigo: string;
  onSaved: () => void;
};

export function UploadStep({ proximoCodigo, onSaved }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [form, setForm] = useState({ nome: '', categoria: 'contrato', codigo: proximoCodigo });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function pickFile(f: File) {
    setFile(f);
    setForm((prev) => ({ ...prev, nome: prev.nome || fileToNome(f.name) }));
    const found = await extractTagsFromDocx(f);
    setTags(found);
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f?.name.endsWith('.docx')) pickFile(f);
  };

  const handleSave = async () => {
    if (!file) return setError('Selecione um arquivo .docx');
    if (!form.nome.trim()) return setError('Informe o nome do template');
    if (!form.codigo.trim()) return setError('Informe o código do template');
    setError('');
    setSaving(true);

    const fd = new FormData();
    fd.append('arquivo', file);
    fd.append('mappings', JSON.stringify([]));
    fd.append('nome', form.nome.trim());
    fd.append('categoria', form.categoria);
    fd.append('codigo', form.codigo.trim());
    fd.append('campos_contextuais', JSON.stringify([]));

    const res = await fetch('/api/configuracoes/templates/wizard/save', { method: 'POST', body: fd });
    const json = await res.json();
    setSaving(false);

    if (!res.ok) return setError(json.error ?? 'Erro ao salvar.');
    onSaved();
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-foreground">Selecione o documento</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Faça upload do DOCX com as tags já inseridas no Word (ex: <span className="font-mono text-primary">{'{cliente.nome_completo}'}</span>).
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !file && fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
          file
            ? 'border-primary/40 bg-primary/5'
            : 'border-border hover:border-primary/40 hover:bg-secondary/30 cursor-pointer'
        }`}
      >
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileText className="w-7 h-7 text-blue-500 shrink-0" />
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                setTags([]);
                setForm((f) => ({ ...f, nome: '' }));
              }}
              className="ml-2 text-muted-foreground hover:text-foreground text-xs"
            >
              trocar
            </button>
          </div>
        ) : (
          <>
            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">Arraste o DOCX aqui</p>
            <p className="text-xs text-muted-foreground mt-1">ou clique para selecionar</p>
          </>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".docx"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f); e.target.value = ''; }}
      />

      {/* Tags detectadas */}
      {file && (
        <div className="rounded-xl border border-border bg-secondary/20 px-4 py-3 space-y-2">
          <div className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Tags detectadas no documento
            </p>
          </div>
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span key={t} className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                  {t}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              Nenhuma tag encontrada. Certifique-se de usar o formato <span className="font-mono not-italic">{'{tag}'}</span> no Word.
            </p>
          )}
        </div>
      )}

      {/* Metadados */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="wz-codigo">Código</Label>
          <Input
            id="wz-codigo"
            placeholder={proximoCodigo}
            value={form.codigo}
            onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="wz-categoria">Categoria</Label>
          <select
            id="wz-categoria"
            value={form.categoria}
            onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {FAMILIAS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="wz-nome">Nome do template</Label>
        <Input
          id="wz-nome"
          placeholder="ex: Contrato — Aposentadoria por Idade"
          value={form.nome}
          onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
        />
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <Button onClick={handleSave} disabled={saving || !file} className="w-full gap-2">
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Salvando…
          </>
        ) : (
          'Salvar template'
        )}
      </Button>
    </div>
  );
}

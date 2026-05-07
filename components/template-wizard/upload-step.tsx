'use client';

import { useRef, useState } from 'react';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { TagSuggestion } from '@/lib/template-wizard/ai-tagger';

const FAMILIAS = [
  { value: 'contrato', label: 'Contrato' },
  { value: 'procuracao', label: 'Procuração' },
  { value: 'declaracao', label: 'Declaração' },
  { value: 'termo', label: 'Termo' },
  { value: 'outro', label: 'Outro' },
];

type Props = {
  onAnalyzed: (result: {
    file: File;
    suggestions: TagSuggestion[];
    textPreview: string;
    nome: string;
    categoria: string;
    codigo: string;
  }) => void;
};

export function UploadStep({ onAnalyzed }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({ nome: '', categoria: 'contrato', codigo: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function fileToNome(filename: string) {
    return filename
      .replace(/\.docx$/i, '')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function pickFile(f: File) {
    setFile(f);
    setForm((prev) => ({ ...prev, nome: prev.nome || fileToNome(f.name) }));
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f?.name.endsWith('.docx')) pickFile(f);
  };

  const handleAnalyze = async () => {
    if (!file) return setError('Selecione um arquivo .docx');
    if (!form.nome.trim()) return setError('Informe o nome do template');
    if (!form.codigo.trim()) return setError('Informe o código do template');
    setError('');
    setLoading(true);

    const fd = new FormData();
    fd.append('arquivo', file);

    const res = await fetch('/api/configuracoes/templates/wizard/analyze', { method: 'POST', body: fd });
    const json = await res.json();
    setLoading(false);

    if (!res.ok) return setError(json.error ?? 'Erro na análise.');
    onAnalyzed({ file, suggestions: json.suggestions, textPreview: json.textPreview, ...form });
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-foreground">1. Selecione o documento</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Faça upload do DOCX original (sem edição). A IA identificará os dados a substituir.
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
              onClick={(e) => { e.stopPropagation(); setFile(null); setForm((f) => ({ ...f, nome: '' })); }}
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

      {/* Metadados básicos */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="wz-codigo">Código</Label>
          <Input
            id="wz-codigo"
            placeholder="ex: 16"
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

      <Button onClick={handleAnalyze} disabled={loading} className="w-full gap-2">
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Analisando com IA…
          </>
        ) : (
          'Analisar documento com IA'
        )}
      </Button>
    </div>
  );
}

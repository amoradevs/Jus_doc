'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

type Template = {
  id: string;
  codigo: string;
  nome: string;
  familia: string;
  formato: string;
  ativo: string;
  editado_em: string | null;
  editado_por: string | null;
  storage_path: string | null;
};

const FAMILIAS = ['contrato', 'procuracao', 'declaracao', 'termo', 'outro'];

const FAMILIA_LABEL: Record<string, string> = {
  contrato: 'Contrato',
  procuracao: 'Procuração',
  declaracao: 'Declaração',
  termo: 'Termo',
  outro: 'Outro',
};

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function TemplateManager({ templates: initial }: { templates: Template[] }) {
  const router = useRouter();
  const [templates, setTemplates] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editFamilia, setEditFamilia] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadForm, setUploadForm] = useState({ codigo: '', nome: '', categoria: 'contrato' });

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return toast.error('Selecione um arquivo');
    if (!uploadForm.codigo.trim() || !uploadForm.nome.trim()) return toast.error('Preencha código e nome');

    setUploading(true);
    const form = new FormData();
    form.append('arquivo', file);
    form.append('codigo', uploadForm.codigo.trim());
    form.append('nome', uploadForm.nome.trim());
    form.append('categoria', uploadForm.categoria);

    const res = await fetch('/api/configuracoes/templates', { method: 'POST', body: form });
    const json = await res.json();
    setUploading(false);

    if (!res.ok) return toast.error(json.error ?? 'Erro no upload');
    setTemplates((prev) => [...prev, json]);
    setShowUpload(false);
    setUploadForm({ codigo: '', nome: '', categoria: 'contrato' });
    if (fileRef.current) fileRef.current.value = '';
    toast.success('Template adicionado');
  }

  async function handleEdit(id: string) {
    const res = await fetch(`/api/configuracoes/templates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: editNome, familia: editFamilia }),
    });
    const json = await res.json();
    if (!res.ok) return toast.error(json.error ?? 'Erro ao salvar');
    setTemplates((prev) => prev.map((t) => (t.id === id ? json : t)));
    setEditingId(null);
    toast.success('Template atualizado');
  }

  async function handleToggle(id: string, ativo: string) {
    const res = await fetch(`/api/configuracoes/templates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: ativo === 'true' ? 'false' : 'true' }),
    });
    const json = await res.json();
    if (!res.ok) return toast.error(json.error ?? 'Erro');
    setTemplates((prev) => prev.map((t) => (t.id === id ? json : t)));
  }

  const ativos = templates.filter((t) => t.ativo === 'true');
  const inativos = templates.filter((t) => t.ativo !== 'true');

  return (
    <div className="space-y-6">

      {/* Botões de ação */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => router.push('/configuracoes/templates/wizard')}
          className="rounded-xl gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Usar Wizard (IA)
        </Button>
        <Button onClick={() => setShowUpload((v) => !v)} className="rounded-xl gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Adicionar template
        </Button>
      </div>

      {/* Formulário de upload */}
      {showUpload && (
        <form onSubmit={handleUpload} className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-foreground">Novo template</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="codigo">Código</Label>
              <Input
                id="codigo"
                placeholder="ex: 16"
                value={uploadForm.codigo}
                onChange={(e) => setUploadForm((f) => ({ ...f, codigo: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="categoria">Categoria</Label>
              <select
                id="categoria"
                value={uploadForm.categoria}
                onChange={(e) => setUploadForm((f) => ({ ...f, categoria: e.target.value }))}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {FAMILIAS.map((f) => (
                  <option key={f} value={f}>{FAMILIA_LABEL[f]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome do template</Label>
            <Input
              id="nome"
              placeholder="ex: Contrato BPC — Idoso"
              value={uploadForm.nome}
              onChange={(e) => setUploadForm((f) => ({ ...f, nome: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="arquivo">Arquivo (.docx)</Label>
            <input
              id="arquivo"
              ref={fileRef}
              type="file"
              accept=".docx,.pdf"
              className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-secondary file:text-foreground hover:file:bg-secondary/80 cursor-pointer"
            />
            <p className="text-xs text-muted-foreground">
              Use tags <code className="bg-secondary px-1 rounded text-[11px]">{'{CAMPO}'}</code> no documento para os dados do cliente.
            </p>
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={uploading} className="rounded-xl">
              {uploading ? 'Enviando…' : 'Salvar template'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowUpload(false)} className="rounded-xl">
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {/* Lista de templates ativos */}
      <TemplateTable
        templates={ativos}
        editingId={editingId}
        editNome={editNome}
        editFamilia={editFamilia}
        onEdit={(t) => { setEditingId(t.id); setEditNome(t.nome); setEditFamilia(t.familia); }}
        onEditNome={setEditNome}
        onEditFamilia={setEditFamilia}
        onEditSave={handleEdit}
        onEditCancel={() => setEditingId(null)}
        onToggle={handleToggle}
      />

      {/* Inativos */}
      {inativos.length > 0 && (
        <details className="group">
          <summary className="text-sm text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors list-none flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform group-open:rotate-90">
              <path d="M9 18l6-6-6-6" strokeLinecap="round"/>
            </svg>
            {inativos.length} template(s) inativo(s)
          </summary>
          <div className="mt-3">
            <TemplateTable
              templates={inativos}
              editingId={editingId}
              editNome={editNome}
              editFamilia={editFamilia}
              onEdit={(t) => { setEditingId(t.id); setEditNome(t.nome); setEditFamilia(t.familia); }}
              onEditNome={setEditNome}
              onEditFamilia={setEditFamilia}
              onEditSave={handleEdit}
              onEditCancel={() => setEditingId(null)}
              onToggle={handleToggle}
              dimmed
            />
          </div>
        </details>
      )}
    </div>
  );
}

type TableProps = {
  templates: Template[];
  editingId: string | null;
  editNome: string;
  editFamilia: string;
  onEdit: (t: Template) => void;
  onEditNome: (v: string) => void;
  onEditFamilia: (v: string) => void;
  onEditSave: (id: string) => void;
  onEditCancel: () => void;
  onToggle: (id: string, ativo: string) => void;
  dimmed?: boolean;
};

function TemplateTable({
  templates, editingId, editNome, editFamilia,
  onEdit, onEditNome, onEditFamilia, onEditSave, onEditCancel, onToggle, dimmed,
}: TableProps) {
  if (templates.length === 0) return null;

  return (
    <div className={`bg-card border border-border rounded-2xl overflow-hidden${dimmed ? ' opacity-60' : ''}`}>
      {templates.map((t, i) => (
        <div
          key={t.id}
          className={`px-5 py-4${i !== 0 ? ' border-t border-border' : ''}`}
        >
          {editingId === t.id ? (
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <Input
                value={editNome}
                onChange={(e) => onEditNome(e.target.value)}
                className="flex-1 h-8 text-sm"
              />
              <select
                value={editFamilia}
                onChange={(e) => onEditFamilia(e.target.value)}
                className="h-8 rounded-lg border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {FAMILIAS.map((f) => <option key={f} value={f}>{FAMILIA_LABEL[f]}</option>)}
              </select>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => onEditSave(t.id)} className="h-8 rounded-lg text-xs">Salvar</Button>
                <Button size="sm" variant="ghost" onClick={onEditCancel} className="h-8 rounded-lg text-xs">Cancelar</Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {/* Ícone formato */}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                t.formato === 'docx'
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                  : 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
              }`}>
                {t.formato}
              </span>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  <span className="text-muted-foreground mr-1.5">{t.codigo}.</span>
                  {t.nome}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {FAMILIA_LABEL[t.familia] ?? t.familia}
                  {t.editado_em && (
                    <> · Editado em {formatDate(t.editado_em)}{t.editado_por ? ` por ${t.editado_por}` : ''}</>
                  )}
                  {t.storage_path && (
                    <span className="ml-1.5 text-primary text-[10px]">● Storage</span>
                  )}
                </p>
              </div>

              {/* Ações */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onEdit(t)}
                  title="Editar nome"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round"/>
                  </svg>
                </button>
                <button
                  onClick={() => onToggle(t.id, t.ativo)}
                  title={t.ativo === 'true' ? 'Desativar' : 'Ativar'}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  {t.ativo === 'true' ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

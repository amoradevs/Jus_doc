'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Trash2, Pencil, Check, Plus, Upload } from 'lucide-react';

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editFamilia, setEditFamilia] = useState('');
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const replacingIdRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modo seleção para exclusão em massa
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(templates.map((t) => t.id)));
  }

  function clearSelection() {
    setSelecting(false);
    setSelected(new Set());
  }

  async function handleDeleteSelected() {
    if (selected.size === 0) return;
    setDeleting(true);

    const ids = Array.from(selected);
    await Promise.all(
      ids.map((id) =>
        fetch(`/api/configuracoes/templates/${id}`, { method: 'DELETE' }),
      ),
    );

    setTemplates((prev) => prev.filter((t) => !selected.has(t.id)));
    toast.success(`${ids.length} template(s) excluído(s)`);
    clearSelection();
    setDeleting(false);
  }

  async function handleDeleteOne(id: string) {
    const res = await fetch(`/api/configuracoes/templates/${id}`, { method: 'DELETE' });
    if (!res.ok) return toast.error('Erro ao excluir');
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    toast.success('Template excluído');
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

  function abrirSubstituicao(id: string) {
    replacingIdRef.current = id;
    fileInputRef.current?.click();
  }

  async function handleSubstituir(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const id = replacingIdRef.current;
    if (!file || !id) return;

    // Reset input para permitir selecionar o mesmo arquivo novamente
    e.target.value = '';

    setUploadingId(id);
    try {
      const form = new FormData();
      form.append('arquivo', file);

      const res = await fetch(`/api/configuracoes/templates/${id}`, {
        method: 'PUT',
        body: form,
      });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error ?? 'Erro ao substituir arquivo.');
        return;
      }

      setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, ...json } : t)));
      toast.success('Arquivo substituído com sucesso.');
    } catch {
      toast.error('Erro de conexão. Tente novamente.');
    } finally {
      setUploadingId(null);
      replacingIdRef.current = null;
    }
  }

  const allSelected = templates.length > 0 && selected.size === templates.length;

  return (
    <div className="space-y-4">
      {/* Input de arquivo oculto — compartilhado entre todos os templates */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".docx,.pdf"
        className="hidden"
        onChange={handleSubstituir}
      />

      {/* Barra de ações */}
      <div className="flex items-center justify-between gap-3">
        {selecting ? (
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={allSelected ? () => setSelected(new Set()) : selectAll}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {allSelected ? 'Desmarcar todos' : 'Selecionar todos'}
            </button>
            {selected.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteSelected}
                disabled={deleting}
                className="gap-1.5 rounded-xl"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {deleting ? 'Excluindo…' : `Excluir ${selected.size} selecionado(s)`}
              </Button>
            )}
            <button
              onClick={clearSelection}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setSelecting(true)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Selecionar para excluir
          </button>
        )}

        <Button
          onClick={() => router.push('/configuracoes/templates/wizard')}
          className="rounded-xl gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Adicionar template
        </Button>
      </div>

      {/* Lista */}
      {templates.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl px-5 py-12 text-center">
          <p className="text-sm text-muted-foreground">Nenhum template cadastrado.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Use o botão acima para adicionar o primeiro template via Wizard.
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {templates.map((t, i) => (
            <div
              key={t.id}
              className={`px-5 py-4${i !== 0 ? ' border-t border-border' : ''}${
                selecting && selected.has(t.id) ? ' bg-destructive/5' : ''
              }`}
            >
              {editingId === t.id ? (
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <Input
                    value={editNome}
                    onChange={(e) => setEditNome(e.target.value)}
                    className="flex-1 h-8 text-sm"
                  />
                  <select
                    value={editFamilia}
                    onChange={(e) => setEditFamilia(e.target.value)}
                    className="h-8 rounded-lg border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {FAMILIAS.map((f) => <option key={f} value={f}>{FAMILIA_LABEL[f]}</option>)}
                  </select>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleEdit(t.id)} className="h-8 rounded-lg text-xs">Salvar</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-8 rounded-lg text-xs">Cancelar</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  {/* Checkbox de seleção */}
                  {selecting && (
                    <button
                      onClick={() => toggleSelect(t.id)}
                      className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        selected.has(t.id)
                          ? 'bg-destructive border-destructive'
                          : 'border-border hover:border-destructive/50'
                      }`}
                    >
                      {selected.has(t.id) && <Check className="w-3 h-3 text-destructive-foreground" />}
                    </button>
                  )}

                  {/* Badge formato */}
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
                        <> · {formatDate(t.editado_em)}{t.editado_por ? ` por ${t.editado_por}` : ''}</>
                      )}
                    </p>
                  </div>

                  {/* Ações individuais */}
                  {!selecting && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => { setEditingId(t.id); setEditNome(t.nome); setEditFamilia(t.familia); }}
                        title="Renomear"
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => abrirSubstituicao(t.id)}
                        disabled={uploadingId === t.id}
                        title="Substituir arquivo"
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
                      >
                        {uploadingId === t.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Excluir "${t.nome}"? Esta ação é permanente.`)) {
                            handleDeleteOne(t.id);
                          }
                        }}
                        title="Excluir"
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

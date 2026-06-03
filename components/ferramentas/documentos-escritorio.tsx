'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FolderOpen,
  Plus,
  FileText,
  Download,
  Trash2,
  Loader2,
  Eye,
  X,
  Pencil,
  Printer,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

// ─── Types ──────────────────────────────────────────────────────────────────

type FileItem = {
  nome: string;
  path: string;
  tipo: 'pdf' | 'docx' | 'outro';
  tamanho: number;
};

type UploadStatus = 'uploading' | 'done' | 'error';

type UploadState = {
  nome: string;
  status: UploadStatus;
  error?: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function displayName(nome: string): string {
  return nome.replace(/\.(pdf|docx)$/i, '').replace(/_/g, ' ');
}

// ─── File Viewer ─────────────────────────────────────────────────────────────

function FileViewer({ file, onClose }: { file: FileItem; onClose: () => void }) {
  const [view, setView] = useState<'viewer' | 'editor'>('viewer');
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [officeUrl, setOfficeUrl] = useState<string | null>(null);
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingEditor, setLoadingEditor] = useState(false);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/ferramentas/documentos-escritorio/url?path=${encodeURIComponent(file.path)}`);
        const data = await res.json() as { url?: string };
        if (!data.url) throw new Error('Erro ao gerar link.');
        if (file.tipo === 'pdf') {
          const r = await fetch(data.url);
          if (!r.ok) throw new Error('Erro ao carregar PDF.');
          setBlobUrl(URL.createObjectURL(await r.blob()));
        } else {
          setOfficeUrl(data.url);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar arquivo.');
      } finally {
        setLoading(false);
      }
    }
    void load();
    return () => { setBlobUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null; }); };
  }, [file.path, file.tipo]);

  const abrirEditor = async () => {
    setLoadingEditor(true);
    try {
      const res = await fetch(`/api/ferramentas/documentos-escritorio/html?path=${encodeURIComponent(file.path)}`);
      const data = await res.json() as { html?: string; error?: string };
      if (!res.ok || !data.html) throw new Error(data.error ?? 'Este documento não suporta edição.');
      setHtml(data.html);
      setView('editor');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar editor.');
    } finally {
      setLoadingEditor(false);
    }
  };

  const salvarComoPDF = () => {
    const content = editorRef.current?.innerHTML ?? html;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>${displayName(file.nome)}</title><style>
  body { font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.5; color: #000; margin: 0; }
  @page { margin: 2.5cm; size: A4; }
  h1, h2, h3 { text-align: center; font-weight: bold; margin: 0.5em 0; font-size: 12pt; }
  p { margin: 0 0 0.5em; text-align: justify; }
  strong, b { font-weight: bold; }
  em, i { font-style: italic; }
  u { text-decoration: underline; }
  table { width: 100%; border-collapse: collapse; margin: 0.5em 0; }
  td, th { border: 1px solid #000; padding: 3px 6px; font-size: 11pt; }
  ul, ol { margin: 0.3em 0 0.3em 1.5em; }
</style></head><body>${content}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  const handleSave = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/ferramentas/documentos-escritorio/url?path=${encodeURIComponent(file.path)}`);
      const data = await res.json() as { url?: string };
      if (!data.url) return;
      const r = await fetch(data.url);
      const blob = await r.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href; a.download = file.nome;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(href);
    } finally { setDownloading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4 text-primary" />
        </div>
        <span className="flex-1 text-sm font-medium text-foreground truncate min-w-0">
          {displayName(file.nome)}
        </span>

        {view === 'viewer' ? (
          <div className="flex items-center gap-2 shrink-0">
            {file.tipo === 'docx' && (
              <Button size="sm" variant="outline" onClick={abrirEditor} disabled={loadingEditor || loading} className="gap-1.5">
                {loadingEditor ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Pencil className="w-3.5 h-3.5" />}
                Editar
              </Button>
            )}
            <Button size="sm" onClick={handleSave} disabled={downloading} className="gap-1.5">
              {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              Salvar
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="outline" onClick={() => setView('viewer')} className="gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />
              Ver documento
            </Button>
            <Button size="sm" onClick={salvarComoPDF} className="gap-1.5">
              <Printer className="w-3.5 h-3.5" />
              Salvar como PDF
            </Button>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0 ml-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      {view === 'viewer' ? (
        <div className="flex-1 relative bg-secondary/20">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Carregando…</span>
            </div>
          )}
          {error && !loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          )}
          {file.tipo === 'pdf' && blobUrl && (
            <iframe src={blobUrl} className="w-full h-full border-0" title={displayName(file.nome)} />
          )}
          {file.tipo === 'docx' && officeUrl && (
            <iframe
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(officeUrl)}`}
              className="w-full h-full border-0"
              title={displayName(file.nome)}
            />
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-auto bg-secondary/10 py-10 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="mb-4 px-4 py-3 bg-primary/5 border border-primary/20 rounded-xl space-y-2">
              <div className="flex items-center gap-2">
                <Pencil className="w-3.5 h-3.5 text-primary shrink-0" />
                <p className="text-xs font-medium text-foreground">Como usar o editor</p>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1 pl-5 list-disc">
                <li>Clique em qualquer trecho do documento para editar o texto.</li>
                <li>
                  Formatação rápida:{' '}
                  <kbd className="px-1 py-0.5 bg-secondary rounded font-mono">Ctrl+B</kbd> negrito &nbsp;
                  <kbd className="px-1 py-0.5 bg-secondary rounded font-mono">Ctrl+I</kbd> itálico &nbsp;
                  <kbd className="px-1 py-0.5 bg-secondary rounded font-mono">Ctrl+U</kbd> sublinhado
                </li>
                <li>Quando terminar, clique em <strong>Salvar como PDF</strong> — escolha <em>"Salvar como PDF"</em> na lista de impressoras.</li>
                <li>Para voltar ao documento original, clique em <strong>Ver documento</strong>.</li>
              </ul>
            </div>
            <style>{`
              .doc-editor p { margin: 0 0 0.55em; text-align: justify; }
              .doc-editor h1, .doc-editor h2, .doc-editor h3 { text-align: center; font-weight: bold; margin: 0.6em 0 0.3em; font-size: 12pt; }
              .doc-editor strong { font-weight: bold; }
              .doc-editor em { font-style: italic; }
              .doc-editor u { text-decoration: underline; }
              .doc-editor table { width: 100%; border-collapse: collapse; margin: 0.5em 0; }
              .doc-editor td, .doc-editor th { border: 1px solid #333; padding: 4px 8px; }
              .doc-editor ul, .doc-editor ol { margin: 0.3em 0 0.3em 1.5em; }
            `}</style>
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              dangerouslySetInnerHTML={{ __html: html }}
              className="doc-editor bg-white shadow-sm rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
              style={{ fontFamily: 'Arial, sans-serif', fontSize: '12pt', lineHeight: '1.5', color: '#000', padding: '2.5cm', minHeight: '29.7cm' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="flex flex-col gap-3 py-1" aria-label="Carregando arquivos">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3 animate-pulse">
          <div className="w-4 h-4 rounded bg-muted" />
          <div className="w-7 h-7 rounded-md bg-muted" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-muted rounded w-2/3" />
            <div className="h-2 bg-muted rounded w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── File Row ────────────────────────────────────────────────────────────────

const BTN_ACTION = 'flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-secondary disabled:opacity-40';

function FileRow({
  file,
  checked,
  onToggle,
  onDelete,
  onRename,
}: {
  file: FileItem;
  checked: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onRename: (novoNome: string) => Promise<void>;
}) {
  const [viewing, setViewing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  useEffect(() => {
    if (isRenaming) setTimeout(() => renameInputRef.current?.focus(), 0);
  }, [isRenaming]);

  const handleDeleteClick = () => {
    if (confirmDelete) {
      onDelete();
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
      timerRef.current = setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  const startRename = () => {
    setRenameValue(displayName(file.nome));
    setRenameError(null);
    setIsRenaming(true);
    setConfirmDelete(false);
  };

  const cancelRename = () => setIsRenaming(false);

  const confirmRename = async () => {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === displayName(file.nome)) { setIsRenaming(false); return; }
    setRenaming(true);
    setRenameError(null);
    try {
      await onRename(trimmed);
      setIsRenaming(false);
    } catch (err) {
      setRenameError(err instanceof Error ? err.message : 'Erro ao renomear.');
    } finally {
      setRenaming(false);
    }
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') void confirmRename();
    if (e.key === 'Escape') cancelRename();
  };

  const handleDownloadFile = async () => {
    setLoadingFile(true);
    try {
      const res = await fetch(`/api/ferramentas/documentos-escritorio/url?path=${encodeURIComponent(file.path)}`);
      const data = await res.json() as { url?: string };
      if (!data.url) return;
      const r = await fetch(data.url);
      const blob = await r.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href; a.download = file.nome;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(href);
    } catch { /* silently ignore */ } finally { setLoadingFile(false); }
  };

  return (
    <>
    {viewing && <FileViewer file={file} onClose={() => setViewing(false)} />}
    <div className="flex items-center gap-3 py-2 px-1 rounded-lg hover:bg-secondary/40 transition-colors">
      {/* Checkbox */}
      <Checkbox
        checked={checked}
        onCheckedChange={onToggle}
        id={`file-${file.path}`}
        aria-label={`Selecionar ${file.nome}`}
        disabled={isRenaming}
      />

      {/* Icon */}
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <FileText className="w-4 h-4 text-primary" />
      </div>

      {/* Name — double-click to rename */}
      {isRenaming ? (
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <input
              ref={renameInputRef}
              value={renameValue}
              onChange={(e) => { setRenameValue(e.target.value); setRenameError(null); }}
              onKeyDown={handleRenameKeyDown}
              disabled={renaming}
              className={`flex-1 min-w-0 text-sm font-medium bg-background border rounded-md px-2 py-1 focus:outline-none focus:ring-1 disabled:opacity-50 ${
                renameError ? 'border-red-400 focus:ring-red-400' : 'border-border focus:ring-primary'
              }`}
              aria-label="Novo nome do arquivo"
            />
            {renaming
              ? <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground shrink-0" />
              : <button onClick={cancelRename} className="p-1 rounded-md text-muted-foreground hover:bg-secondary transition-colors shrink-0" aria-label="Cancelar"><X className="w-3.5 h-3.5" /></button>
            }
          </div>
          {renameError && <p className="text-xs text-red-500 px-0.5">{renameError}</p>}
        </div>
      ) : (
        <div
          className="flex-1 min-w-0 cursor-text select-none"
          onDoubleClick={startRename}
          title="Clique duas vezes para renomear"
        >
          <p className="text-sm font-medium text-foreground truncate">{displayName(file.nome)}</p>
        </div>
      )}

      {/* Actions — always visible, hidden while renaming */}
      {!isRenaming && (
        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={() => setViewing(true)} className={BTN_ACTION} aria-label="Ver arquivo">
            <Eye className="w-3.5 h-3.5" />
            Ver
          </button>

          {file.tipo === 'pdf' && (
            <button onClick={handleDownloadFile} disabled={loadingFile} className={BTN_ACTION} aria-label="Baixar PDF">
              {loadingFile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              PDF
            </button>
          )}

          {file.tipo === 'docx' && (
            <button onClick={handleDownloadFile} disabled={loadingFile} className={BTN_ACTION} aria-label="Baixar Word">
              {loadingFile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
              Word
            </button>
          )}

          <button
            onClick={handleDeleteClick}
            className={`${BTN_ACTION} ${confirmDelete ? 'text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50' : 'hover:text-red-500'}`}
            aria-label={confirmDelete ? 'Confirmar exclusão' : 'Excluir arquivo'}
          >
            <Trash2 className="w-3.5 h-3.5" />
            {confirmDelete ? 'Confirmar?' : 'Excluir'}
          </button>
        </div>
      )}
    </div>
    </>
  );
}

// ─── Upload Badge ─────────────────────────────────────────────────────────────

function UploadBadge({ upload }: { upload: UploadState }) {
  return (
    <div className="flex items-center gap-2 py-2 px-1">
      <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center shrink-0">
        <FileText className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{displayName(upload.nome)}</p>
        {upload.status === 'uploading' && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <Loader2 className="w-3 h-3 animate-spin" />
            Enviando…
          </span>
        )}
        {upload.status === 'error' && (
          <span className="text-xs text-red-500 mt-0.5 block">{upload.error}</span>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DocumentosEscritorio() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [downloading, setDownloading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // ── Load files ──────────────────────────────────────────────────────────────

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ferramentas/documentos-escritorio');
      const data = await res.json() as { files?: FileItem[]; error?: string };
      if (res.ok && data.files) {
        setFiles(data.files);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFiles();
  }, [loadFiles]);

  // ── Selection ───────────────────────────────────────────────────────────────

  const toggleFile = (path: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === files.length && files.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(files.map((f) => f.path)));
    }
  };

  const allSelected = files.length > 0 && selected.size === files.length;
  const someSelected = selected.size > 0 && selected.size < files.length;

  // ── Upload ──────────────────────────────────────────────────────────────────

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    // Copiar referências ANTES de limpar o input — Chrome/Safari invalidam FileList após value=''
    const filesToUpload = Array.from(fileList);
    e.target.value = '';

    // Inicializar estados de upload
    const initialStates: UploadState[] = filesToUpload.map((f) => ({
      nome: f.name,
      status: 'uploading',
    }));
    setUploads((prev) => [...prev, ...initialStates]);

    // Fazer uploads em paralelo
    await Promise.all(
      filesToUpload.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        try {
          const res = await fetch('/api/ferramentas/documentos-escritorio/upload', {
            method: 'POST',
            body: formData,
          });
          const data = await res.json() as { ok?: boolean; error?: string };

          if (!res.ok || !data.ok) {
            setUploads((prev) =>
              prev.map((u) =>
                u.nome === file.name
                  ? { ...u, status: 'error', error: data.error ?? 'Erro no upload.' }
                  : u,
              ),
            );
          } else {
            setUploads((prev) => prev.filter((u) => u.nome !== file.name));
          }
        } catch {
          setUploads((prev) =>
            prev.map((u) =>
              u.nome === file.name
                ? { ...u, status: 'error', error: 'Falha de conexão.' }
                : u,
            ),
          );
        }
      }),
    );

    await loadFiles();
  };

  // ── Rename ──────────────────────────────────────────────────────────────────

  const handleRename = async (path: string, novoNome: string) => {
    const res = await fetch('/api/ferramentas/documentos-escritorio/renomear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, novoNome }),
    });
    const data = await res.json() as { ok?: boolean; path?: string; nome?: string; error?: string };
    if (!res.ok || !data.ok) throw new Error(data.error ?? 'Erro ao renomear.');
    setFiles((prev) =>
      prev.map((f) =>
        f.path === path
          ? { ...f, path: data.path ?? f.path, nome: data.nome ?? f.nome }
          : f,
      ),
    );
    setSelected((prev) => {
      if (!prev.has(path) || !data.path) return prev;
      const next = new Set(prev);
      next.delete(path);
      next.add(data.path);
      return next;
    });
  };

  // ── Delete ──────────────────────────────────────────────────────────────────

  const handleDelete = async (path: string) => {
    const res = await fetch(
      `/api/ferramentas/documentos-escritorio?path=${encodeURIComponent(path)}`,
      { method: 'DELETE' },
    );
    if (res.ok) {
      setFiles((prev) => prev.filter((f) => f.path !== path));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(path);
        return next;
      });
    }
  };

  // ── Download ZIP ────────────────────────────────────────────────────────────

  const handleDownloadSelected = async () => {
    if (selected.size === 0) return;
    setDownloading(true);
    try {
      const res = await fetch('/api/ferramentas/documentos-escritorio/baixar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: Array.from(selected) }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'documentos.zip';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="bg-white dark:bg-card border border-border rounded-xl p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center shrink-0">
            <FolderOpen className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Documentos do Escritório</h2>
            <p className="text-xs text-muted-foreground">Arquivos para edição e impressão</p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          className="gap-1.5 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          Adicionar arquivo
        </Button>
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx"
        multiple
        className="hidden"
        onChange={handleFileInput}
      />

      {/* File list */}
      <div className="flex flex-col min-h-[120px]">
        {loading ? (
          <Skeleton />
        ) : files.length === 0 && uploads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
            <FolderOpen className="w-8 h-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Nenhum arquivo ainda.{' '}
              <button
                onClick={() => inputRef.current?.click()}
                className="text-primary hover:underline"
              >
                Clique em Adicionar arquivo
              </button>{' '}
              para começar.
            </p>
          </div>
        ) : (
          <div className="flex flex-col -mx-1">
            {/* Uploading items */}
            {uploads.map((u) => (
              <UploadBadge key={u.nome} upload={u} />
            ))}
            {/* Stored files */}
            {files.map((file) => (
              <FileRow
                key={file.path}
                file={file}
                checked={selected.has(file.path)}
                onToggle={() => toggleFile(file.path)}
                onDelete={() => handleDelete(file.path)}
                onRename={(novoNome) => handleRename(file.path, novoNome)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer (sticky-like — shown only when files exist) */}
      {(files.length > 0 || uploads.length > 0) && (
        <div className="flex items-center justify-between pt-2 border-t border-border gap-3">
          {/* Select all */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <Checkbox
              checked={allSelected}
              ref={(el) => {
                if (el) (el as HTMLButtonElement & { indeterminate?: boolean }).indeterminate = someSelected;
              }}
              onCheckedChange={toggleAll}
              id="select-all"
              aria-label="Selecionar todos"
            />
            <span className="text-sm text-muted-foreground">Selecionar todos</span>
          </label>

          {/* Download selected */}
          <Button
            size="sm"
            onClick={handleDownloadSelected}
            disabled={selected.size === 0 || downloading}
            className="gap-1.5"
          >
            {downloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            Baixar selecionados
            {selected.size > 0 && (
              <span className="ml-0.5 opacity-80">({selected.size})</span>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

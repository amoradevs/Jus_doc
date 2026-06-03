'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FolderOpen,
  Plus,
  FileText,
  FileImage,
  Download,
  Trash2,
  Loader2,
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

function formatSize(bytes: number): string {
  if (bytes === 0) return '—';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function displayName(nome: string): string {
  return nome.replace(/\.(pdf|docx)$/i, '');
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

function FileRow({
  file,
  checked,
  onToggle,
  onDelete,
}: {
  file: FileItem;
  checked: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDeleteClick = () => {
    if (confirmDelete) {
      onDelete();
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
      timerRef.current = setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/ferramentas/documentos-escritorio/url?path=${encodeURIComponent(file.path)}`);
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Erro ao gerar link.');
      const a = document.createElement('a');
      a.href = data.url;
      a.download = file.nome;
      a.click();
    } catch {
      // silently ignore — user can retry
    } finally {
      setDownloading(false);
    }
  };

  const FileIcon =
    file.tipo === 'pdf' ? FileImage : file.tipo === 'docx' ? FileText : FileText;

  return (
    <div className="flex items-center gap-3 py-2 px-1 rounded-lg hover:bg-secondary/40 transition-colors group">
      {/* Checkbox */}
      <Checkbox
        checked={checked}
        onCheckedChange={onToggle}
        id={`file-${file.path}`}
        aria-label={`Selecionar ${file.nome}`}
      />

      {/* Icon */}
      <div
        className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
          file.tipo === 'pdf'
            ? 'bg-red-50 dark:bg-red-950/30'
            : 'bg-blue-50 dark:bg-blue-950/30'
        }`}
      >
        <FileIcon
          className={`w-4 h-4 ${
            file.tipo === 'pdf' ? 'text-red-500' : 'text-blue-500'
          }`}
        />
      </div>

      {/* Name + meta */}
      <label htmlFor={`file-${file.path}`} className="flex-1 min-w-0 cursor-pointer">
        <p className="text-sm font-medium text-foreground truncate">{displayName(file.nome)}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold leading-none ${
              file.tipo === 'pdf'
                ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
            }`}
          >
            {file.tipo.toUpperCase()}
          </span>
          <span className="text-xs text-muted-foreground">{formatSize(file.tamanho)}</span>
        </div>
      </label>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
          aria-label="Baixar arquivo"
        >
          {downloading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
        </button>

        <button
          onClick={handleDeleteClick}
          className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
            confirmDelete
              ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/60'
              : 'text-muted-foreground hover:text-red-500 hover:bg-secondary'
          }`}
          aria-label={confirmDelete ? 'Confirmar remoção' : 'Remover arquivo'}
        >
          {confirmDelete ? (
            'Confirmar?'
          ) : (
            <Trash2 className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
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
    e.target.value = '';

    const filesToUpload = Array.from(fileList);

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

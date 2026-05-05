'use client';

import { useRef, useState } from 'react';
import { FileText, Upload, Download, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type State =
  | { phase: 'idle' }
  | { phase: 'selected'; file: File }
  | { phase: 'compressing' }
  | { phase: 'done'; originalSize: number; compressedSize: number; blob: Blob; filename: string }
  | { phase: 'error'; message: string };

function formatMB(bytes: number) {
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function reduction(original: number, compressed: number) {
  return Math.round((1 - compressed / original) * 100);
}

export function PdfCompressor() {
  const [state, setState] = useState<State>({ phase: 'idle' });
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (file.type !== 'application/pdf') {
      toast.error('Apenas arquivos PDF são aceitos.');
      return;
    }
    setState({ phase: 'selected', file });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleCompress = async () => {
    if (state.phase !== 'selected') return;
    const { file } = state;

    setState({ phase: 'compressing' });

    const form = new FormData();
    form.append('arquivo', file);

    const res = await fetch('/api/ferramentas/comprimir-pdf', { method: 'POST', body: form });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setState({ phase: 'error', message: body.error ?? 'Erro ao comprimir o arquivo.' });
      return;
    }

    const blob = await res.blob();
    const originalSize = parseInt(res.headers.get('X-Original-Size') ?? '0', 10);
    const compressedSize = parseInt(res.headers.get('X-Compressed-Size') ?? String(blob.size), 10);
    const filename = file.name.replace(/\.pdf$/i, '') + '_comprimido.pdf';

    setState({ phase: 'done', originalSize, compressedSize, blob, filename });
  };

  const handleDownload = () => {
    if (state.phase !== 'done') return;
    const url = URL.createObjectURL(state.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = state.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => setState({ phase: 'idle' });

  return (
    <div className="bg-white dark:bg-card border border-border rounded-xl p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <h2 className="font-semibold text-foreground">Compressor de PDF</h2>
          <p className="text-xs text-muted-foreground">Reduza o tamanho para enviar ao Meu INSS e tribunais</p>
        </div>
      </div>

      {/* Idle / Selected — drop zone */}
      {(state.phase === 'idle' || state.phase === 'selected') && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => state.phase === 'idle' && inputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            state.phase === 'selected'
              ? 'border-primary/40 bg-primary/5'
              : 'border-border hover:border-primary/40 hover:bg-secondary/30 cursor-pointer'
          }`}
        >
          {state.phase === 'idle' ? (
            <>
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">Arraste o PDF aqui</p>
              <p className="text-xs text-muted-foreground mt-1">ou clique para selecionar</p>
            </>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-7 h-7 text-red-500 shrink-0" />
                <div className="text-left min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{state.file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatMB(state.file.size)}</p>
                </div>
              </div>
              <button onClick={reset} className="text-muted-foreground hover:text-foreground shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
      />

      {/* Compressing */}
      {state.phase === 'compressing' && (
        <div className="flex flex-col items-center gap-3 py-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Comprimindo via CloudConvert…</p>
          <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-pulse w-2/3" />
          </div>
        </div>
      )}

      {/* Done */}
      {state.phase === 'done' && (
        <div className="flex flex-col gap-4">
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-sm font-semibold text-green-700 dark:text-green-400 mb-3">✓ Compressão concluída!</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Original</p>
                <p className="text-sm font-medium text-foreground">{formatMB(state.originalSize)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Redução</p>
                <p className="text-sm font-bold text-green-600 dark:text-green-400">
                  -{reduction(state.originalSize, state.compressedSize)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Novo tamanho</p>
                <p className="text-sm font-medium text-foreground">{formatMB(state.compressedSize)}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleDownload} className="flex-1 gap-2">
              <Download className="w-4 h-4" />
              Baixar PDF comprimido
            </Button>
            <Button variant="outline" onClick={reset}>
              Novo arquivo
            </Button>
          </div>
        </div>
      )}

      {/* Error */}
      {state.phase === 'error' && (
        <div className="flex flex-col gap-3">
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm font-medium text-red-700 dark:text-red-400">{state.message}</p>
          </div>
          <Button variant="outline" onClick={reset}>Tentar novamente</Button>
        </div>
      )}

      {/* Action button — only in selected state */}
      {state.phase === 'selected' && (
        <Button onClick={handleCompress} className="w-full">
          Comprimir PDF
        </Button>
      )}
    </div>
  );
}

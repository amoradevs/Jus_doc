'use client';

import { useRef, useState } from 'react';
import { FileText, Upload, Download, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type State =
  | { phase: 'idle' }
  | { phase: 'selected'; file: File }
  | { phase: 'uploading'; progress: number }
  | { phase: 'processing' }
  | { phase: 'done'; originalSize: number; compressedSize: number; downloadUrl: string; filename: string }
  | { phase: 'error'; message: string };

function formatMB(bytes: number) {
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function reduction(original: number, compressed: number) {
  return Math.round((1 - compressed / original) * 100);
}

async function pollResult(jobId: string): Promise<{ downloadUrl: string; compressedSize: number }> {
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const res = await fetch(`/api/ferramentas/comprimir-pdf/resultado?jobId=${jobId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? `Erro ${res.status}`);
    if (data.status === 'finished') return { downloadUrl: data.downloadUrl, compressedSize: data.compressedSize };
    if (data.status === 'error') throw new Error(data.error ?? 'Falha no processamento.');
  }
  throw new Error('Tempo limite excedido. Tente novamente.');
}

export function PdfCompressor() {
  const [state, setState] = useState<State>({ phase: 'idle' });
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (file.type !== 'application/pdf') { toast.error('Apenas arquivos PDF são aceitos.'); return; }
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

    // 1. Criar job no CloudConvert e obter URL de upload
    const initRes = await fetch('/api/ferramentas/comprimir-pdf/iniciar', { method: 'POST' });
    const initData = await initRes.json();
    if (!initRes.ok) { setState({ phase: 'error', message: initData.error ?? 'Erro ao iniciar compressão.' }); return; }

    const { jobId, uploadUrl, uploadParams } = initData;

    // 2. Upload direto para CloudConvert (sem passar pelo servidor)
    setState({ phase: 'uploading', progress: 0 });

    await new Promise<void>((resolve, reject) => {
      const formData = new FormData();
      for (const [key, value] of Object.entries(uploadParams as Record<string, string>)) {
        formData.append(key, value);
      }
      formData.append('file', file);

      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) setState({ phase: 'uploading', progress: Math.round((e.loaded / e.total) * 100) });
      });
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(`Erro no upload: ${xhr.status}`));
      });
      xhr.addEventListener('error', () => reject(new Error('Falha de rede no upload.')));
      xhr.open('POST', uploadUrl);
      xhr.send(formData);
    }).catch((err: Error) => {
      setState({ phase: 'error', message: err.message });
      throw err;
    });

    // 3. Aguardar processamento
    setState({ phase: 'processing' });

    try {
      const { downloadUrl, compressedSize } = await pollResult(jobId);
      setState({
        phase: 'done',
        originalSize: file.size,
        compressedSize,
        downloadUrl,
        filename: file.name.replace(/\.pdf$/i, '') + '_comprimido.pdf',
      });
    } catch (err: unknown) {
      setState({ phase: 'error', message: err instanceof Error ? err.message : 'Erro desconhecido.' });
    }
  };

  const handleDownload = () => {
    if (state.phase !== 'done') return;
    const a = document.createElement('a');
    a.href = state.downloadUrl;
    a.download = state.filename;
    a.click();
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
          <p className="text-xs text-muted-foreground">Comprime até 5 MB — ideal para Meu INSS e tribunais</p>
        </div>
      </div>

      {/* Drop zone — idle ou selected */}
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

      {/* Uploading */}
      {state.phase === 'uploading' && (
        <div className="flex flex-col gap-3 py-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Enviando arquivo…</span>
            <span className="font-medium text-foreground">{state.progress}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-200"
              style={{ width: `${state.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Processing */}
      {state.phase === 'processing' && (
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
            <Button variant="outline" onClick={reset}>Novo arquivo</Button>
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

      {/* Botão comprimir */}
      {state.phase === 'selected' && (
        <Button onClick={handleCompress} className="w-full">Comprimir PDF</Button>
      )}
    </div>
  );
}

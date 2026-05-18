'use client';

import { useRef, useState } from 'react';
import { FileText, Upload, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const QUALITIES = [0.75, 0.55, 0.35, 0.2];
const SCALE = 1.2; // ~115 DPI — legível, menor footprint em mobile

type State =
  | { phase: 'idle' }
  | { phase: 'selected'; file: File }
  | { phase: 'compressing'; progress: number; step: string }
  | { phase: 'done'; originalSize: number; compressedSize: number; blob: Blob; filename: string }
  | { phase: 'error'; message: string };

function formatMB(bytes: number) {
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function reduction(original: number, compressed: number) {
  return Math.round((1 - compressed / original) * 100);
}

async function compressPdf(
  file: File,
  onProgress: (pct: number, step: string) => void,
): Promise<Blob> {
  const [pdfjsLib, { PDFDocument }] = await Promise.all([
    import('pdfjs-dist'),
    import('pdf-lib'),
  ]);

  // Worker via CDN — evita configuração de bundler
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

  onProgress(5, 'Carregando PDF…');
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
  const numPages = pdf.numPages;

  // Renderiza todas as páginas em canvas
  const canvases: HTMLCanvasElement[] = [];
  for (let i = 1; i <= numPages; i++) {
    onProgress(5 + Math.round((i / numPages) * 55), `Lendo página ${i} de ${numPages}…`);
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: SCALE });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext('2d')!, canvas, viewport }).promise;
    canvases.push(canvas);
  }

  // Tenta qualidades progressivamente menores; sempre retorna o menor resultado obtido
  let bestBytes: Uint8Array | null = null;
  for (const quality of QUALITIES) {
    onProgress(65, `Comprimindo imagens (qualidade ${Math.round(quality * 100)}%)…`);
    const pdfDoc = await PDFDocument.create();

    for (let i = 0; i < canvases.length; i++) {
      const canvas = canvases[i];
      const jpegDataUrl = canvas.toDataURL('image/jpeg', quality);
      const base64 = jpegDataUrl.split(',')[1];
      const jpegBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const jpegImage = await pdfDoc.embedJpg(jpegBytes);
      const pdfPage = pdfDoc.addPage([canvas.width, canvas.height]);
      pdfPage.drawImage(jpegImage, { x: 0, y: 0, width: canvas.width, height: canvas.height });
      onProgress(65 + Math.round(((i + 1) / canvases.length) * 28), `Montando página ${i + 1} de ${canvases.length}…`);
    }

    const pdfBytes = await pdfDoc.save();
    if (!bestBytes || pdfBytes.byteLength < bestBytes.byteLength) bestBytes = pdfBytes;
  }

  onProgress(100, 'Concluído!');
  return new Blob([bestBytes!.buffer as ArrayBuffer], { type: 'application/pdf' });
}

export function PdfCompressor() {
  const [state, setState] = useState<State>({ phase: 'idle' });
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (file.type !== 'application/pdf') {
      alert('Apenas arquivos PDF são aceitos.');
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

    try {
      const blob = await compressPdf(file, (progress, step) => {
        setState({ phase: 'compressing', progress, step });
      });
      setState({
        phase: 'done',
        originalSize: file.size,
        compressedSize: blob.size,
        blob,
        filename: file.name.replace(/\.pdf$/i, '') + '_comprimido.pdf',
      });
    } catch (err: unknown) {
      setState({ phase: 'error', message: err instanceof Error ? err.message : 'Erro desconhecido.' });
    }
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
          <p className="text-xs text-muted-foreground">Comprime até 5 MB — processado direto no seu dispositivo</p>
        </div>
      </div>

      {/* Drop zone */}
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
        <div className="flex flex-col gap-3 py-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{state.step}</span>
            <span className="font-medium text-foreground tabular-nums">{state.progress}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${state.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Done */}
      {state.phase === 'done' && (
        <div className="flex flex-col gap-4">
          <div className={`border rounded-lg p-4 ${state.compressedSize < state.originalSize ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'}`}>
            <p className={`text-sm font-semibold mb-3 ${state.compressedSize < state.originalSize ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'}`}>
              {state.compressedSize < state.originalSize ? '✓ Compressão concluída!' : '⚠ Arquivo já está no menor tamanho possível'}
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Original</p>
                <p className="text-sm font-medium text-foreground">{formatMB(state.originalSize)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Redução</p>
                <p className={`text-sm font-bold ${state.compressedSize < state.originalSize ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                  {state.compressedSize < state.originalSize ? `-${reduction(state.originalSize, state.compressedSize)}%` : '—'}
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

      {state.phase === 'selected' && (
        <Button onClick={handleCompress} className="w-full">Comprimir PDF</Button>
      )}
    </div>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Check, Download, FileText, Loader2, RotateCcw,
  ChevronLeft, Eye, X, Pencil, Printer, ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type Doc = { codigo: string; nome: string; nome_arquivo: string };
type Status = 'idle' | 'loading' | 'done' | 'error';

async function fetchBlob(url: string): Promise<Blob> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.blob();
}

async function triggerDownload(blob: Blob, filename: string) {
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(href);
}

// ── Visualizador / Editor de PDF ──────────────────────────────────────────────
function PdfViewer({
  doc,
  packageId,
  clientId,
  onClose,
}: {
  doc: Doc;
  packageId: string;
  clientId: string;
  onClose: () => void;
}) {
  const [view, setView] = useState<'pdf' | 'editor'>('pdf');
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(true);
  const [loadingEditor, setLoadingEditor] = useState(false);
  const [html, setHtml] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchBlob(`/api/download/${packageId}/pdf/${doc.codigo}`)
      .then((blob) => setBlobUrl(URL.createObjectURL(blob)))
      .catch(() => setPdfError('Não foi possível carregar o PDF.'))
      .finally(() => setLoadingPdf(false));

    return () => {
      setBlobUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
    };
  }, [doc.codigo, packageId]);

  async function abrirEditor() {
    setLoadingEditor(true);
    try {
      const res = await fetch(`/api/geracao/rascunho?clientId=${clientId}&codigos=${doc.codigo}`);
      const data = await res.json();
      const found = Array.isArray(data) ? data.find((d) => d.codigo === doc.codigo) : null;
      if (found?.html) {
        setHtml(found.html);
        setView('editor');
      } else {
        setPdfError('Este documento não suporta edição.');
      }
    } catch {
      setPdfError('Erro ao carregar editor.');
    }
    setLoadingEditor(false);
  }

  function salvarComoPDF() {
    const content = editorRef.current?.innerHTML ?? html;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>${doc.nome}</title><style>
  body { font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.5;
         color: #000; margin: 0; }
  @page { margin: 2.5cm; size: A4; }
  h1, h2, h3, .doc-title, .doc-subtitle { text-align: center; font-weight: bold;
         margin: 0.5em 0; font-size: 12pt; }
  .doc-center { text-align: center; }
  p { margin: 0 0 0.5em; text-align: justify; }
  strong, b { font-weight: bold; }
  em, i { font-style: italic; }
  u { text-decoration: underline; }
  table { width: 100%; border-collapse: collapse; margin: 0.5em 0; }
  td, th { border: 1px solid #000; padding: 3px 6px; font-size: 11pt; }
  ul, ol { margin: 0.3em 0 0.3em 1.5em; }
  li { margin-bottom: 0.2em; }
</style></head><body>${content}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  }

  async function baixarPdfOriginal() {
    if (!blobUrl) return;
    setDownloading(true);
    const res = await fetch(blobUrl);
    const blob = await res.blob();
    await triggerDownload(blob, doc.nome_arquivo);
    setDownloading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">

      {/* ── Header ── */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card shrink-0">
        {/* Ícone + nome */}
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4 text-primary" />
        </div>
        <span className="flex-1 text-sm font-medium text-foreground truncate min-w-0">
          {doc.nome || doc.codigo}
        </span>

        {view === 'pdf' ? (
          /* Ações no modo PDF */
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={abrirEditor}
              disabled={loadingEditor || loadingPdf}
              className="gap-1.5"
            >
              {loadingEditor
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Pencil className="w-3.5 h-3.5" />}
              Editar
            </Button>
            <Button
              size="sm"
              onClick={baixarPdfOriginal}
              disabled={downloading || !blobUrl}
              className="gap-1.5"
            >
              {downloading
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Download className="w-3.5 h-3.5" />}
              Salvar
            </Button>
          </div>
        ) : (
          /* Ações no modo editor */
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setView('pdf')}
              className="gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Ver PDF
            </Button>
            <Button
              size="sm"
              onClick={salvarComoPDF}
              className="gap-1.5"
            >
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

      {/* ── Corpo ── */}
      {view === 'pdf' ? (
        <div className="flex-1 relative bg-secondary/20">
          {loadingPdf && (
            <div className="absolute inset-0 flex items-center justify-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Carregando PDF…</span>
            </div>
          )}
          {pdfError && !loadingPdf && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">{pdfError}</p>
            </div>
          )}
          {blobUrl && (
            <iframe src={blobUrl} className="w-full h-full border-0" title={doc.nome} />
          )}
        </div>
      ) : (
        /* Editor */
        <div className="flex-1 overflow-auto bg-secondary/10 py-10 px-4">
          <div className="max-w-3xl mx-auto">
            {/* Barra de dica */}
            <div className="flex items-center gap-2 mb-4 px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-xl">
              <Pencil className="w-3.5 h-3.5 text-primary shrink-0" />
              <p className="text-xs text-muted-foreground">
                Clique em qualquer trecho para editar. Use <kbd className="px-1 py-0.5 bg-secondary rounded text-xs font-mono">Ctrl+B</kbd> negrito, <kbd className="px-1 py-0.5 bg-secondary rounded text-xs font-mono">Ctrl+I</kbd> itálico.
              </p>
            </div>
            {/* Documento editável */}
            <style>{`
              .doc-editor p { margin: 0 0 0.55em; text-align: justify; }
              .doc-editor h1, .doc-editor h2, .doc-editor h3 { text-align: center; font-weight: bold; margin: 0.6em 0 0.3em; font-size: 12pt; }
              .doc-editor .doc-title, .doc-editor .doc-subtitle { text-align: center; font-weight: bold; }
              .doc-editor .doc-center { text-align: center; }
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
              style={{
                fontFamily: 'Arial, sans-serif',
                fontSize: '12pt',
                lineHeight: '1.5',
                color: '#000',
                padding: '2.5cm',
                minHeight: '29.7cm',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function ResultadoPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const codigos = searchParams.get('codigos') ?? '';
  const modo = searchParams.get('modo') ?? 'direto';
  const packageIdParam = searchParams.get('packageId') ?? '';

  const [status, setStatus] = useState<Status>(packageIdParam ? 'done' : 'idle');
  const [packageId, setPackageId] = useState(packageIdParam);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);
  const [downloadingDocx, setDownloadingDocx] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<Doc | null>(null);

  // Intercepta botão Voltar do browser quando o viewer está aberto
  useEffect(() => {
    if (!previewing) return;
    history.pushState({ viewerOpen: true }, '');
    function handlePopState() { setPreviewing(null); }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [previewing]);

  function gerar() {
    setStatus('loading');
    fetch('/api/geracao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: id, templateCodes: codigos.split(',').filter(Boolean) }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.packageId) {
          setPackageId(data.packageId);
          setDocs(data.documents ?? []);
          setStatus('done');
        } else {
          setErrorMsg(data.error?.message ?? data.error ?? 'Erro desconhecido');
          setStatus('error');
        }
      })
      .catch(() => { setErrorMsg('Falha de rede'); setStatus('error'); });
  }

  useEffect(() => {
    if (packageIdParam) {
      fetch(`/api/download/${packageIdParam}/docs`)
        .then((r) => r.ok ? r.json() : [])
        .then((data: Doc[]) => setDocs(data))
        .catch(() => {});
    } else if (modo === 'direto') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      gerar();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function baixarZip() {
    setDownloadingZip(true);
    try {
      const blob = await fetchBlob(`/api/download/${packageId}`);
      await triggerDownload(blob, `documentos_${packageId.slice(0, 8)}.zip`);
    } catch {
      setErrorMsg('Erro ao baixar ZIP.');
    }
    setDownloadingZip(false);
  }

  async function baixarPdf(doc: Doc) {
    setDownloadingPdf(doc.codigo);
    try {
      const blob = await fetchBlob(`/api/download/${packageId}/pdf/${doc.codigo}`);
      await triggerDownload(blob, doc.nome_arquivo);
    } catch {
      setErrorMsg('Erro ao baixar PDF.');
    }
    setDownloadingPdf(null);
  }

  async function baixarDocx(doc: Doc) {
    setDownloadingDocx(doc.codigo);
    try {
      const blob = await fetchBlob(`/api/download/${packageId}/docx/${doc.codigo}`);
      await triggerDownload(blob, doc.nome_arquivo.replace(/\.pdf$/, '.docx'));
    } catch {
      setErrorMsg('Erro ao baixar Word.');
    }
    setDownloadingDocx(null);
  }

  /* ── Visualizador / Editor fullscreen ── */
  if (previewing) {
    return (
      <PdfViewer
        doc={previewing}
        packageId={packageId}
        clientId={id}
        onClose={() => history.back()}
      />
    );
  }

  /* ── Escolha modo revisão ── */
  if (modo === 'revisar' && status === 'idle') {
    return (
      <div className="max-w-md">
        <h1 className="text-2xl font-bold text-foreground mb-1">Como deseja gerar?</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Gere os PDFs direto ou revise o conteúdo antes de finalizar.
        </p>
        <div className="grid gap-3">
          <button onClick={gerar} className="flex items-start gap-4 text-left p-5 bg-card border border-border rounded-2xl hover:border-primary/40 hover:bg-secondary/30 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground group-hover:text-primary transition-colors">Gerar PDF direto</p>
              <p className="text-sm text-muted-foreground mt-0.5">Gera e baixa os documentos imediatamente.</p>
            </div>
          </button>
          <Link href={`/clientes/${id}/gerar/revisar?codigos=${codigos}`} className="flex items-start gap-4 text-left p-5 bg-card border border-border rounded-2xl hover:border-primary/40 hover:bg-secondary/30 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Pencil className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground group-hover:text-primary transition-colors">Revisar antes de gerar</p>
              <p className="text-sm text-muted-foreground mt-0.5">Edite o conteúdo antes de gerar o PDF.</p>
            </div>
          </Link>
        </div>
      </div>
    );
  }

  /* ── Loading ── */
  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-10 h-10 border-2 border-muted border-t-primary rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Gerando documentos, aguarde…</p>
      </div>
    );
  }

  /* ── Erro ── */
  if (status === 'error') {
    return (
      <div className="max-w-md space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
            <X className="w-4 h-4 text-red-600 dark:text-red-400" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="font-bold text-foreground">Erro na geração</h1>
            <p className="text-sm text-muted-foreground">{errorMsg}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={gerar} variant="outline" className="gap-2">
            <RotateCcw className="w-4 h-4" /> Tentar novamente
          </Button>
          <Button variant="ghost" asChild>
            <Link href={`/clientes/${id}/gerar`}>Voltar</Link>
          </Button>
        </div>
      </div>
    );
  }

  /* ── Sucesso ── */
  return (
    <div className="max-w-md space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center shrink-0">
          <Check className="w-5 h-5 text-green-600 dark:text-green-400" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Pronto!</h1>
          <p className="text-sm text-muted-foreground">
            {docs.length === 1 ? '1 documento gerado' : `${docs.length} documentos gerados`}
          </p>
        </div>
      </div>

      {docs.length > 0 && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
          {docs.map((doc) => (
            <div key={doc.codigo} className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <span className="flex-1 text-sm font-medium text-foreground truncate min-w-0">
                {doc.nome || doc.codigo}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setPreviewing(doc)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-secondary"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Ver
                </button>
                <button
                  onClick={() => baixarPdf(doc)}
                  disabled={downloadingPdf === doc.codigo}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-secondary disabled:opacity-40"
                >
                  {downloadingPdf === doc.codigo
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Download className="w-3.5 h-3.5" />}
                  PDF
                </button>
                <button
                  onClick={() => baixarDocx(doc)}
                  disabled={downloadingDocx === doc.codigo}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-secondary disabled:opacity-40"
                >
                  {downloadingDocx === doc.codigo
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <FileText className="w-3.5 h-3.5" />}
                  Word
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Button onClick={baixarZip} disabled={downloadingZip} className="w-full gap-2" size="lg">
        {downloadingZip
          ? <><Loader2 className="w-4 h-4 animate-spin" />Baixando…</>
          : <><Download className="w-4 h-4" />Baixar todos em ZIP</>}
      </Button>

      {errorMsg && <p className="text-sm text-red-600 dark:text-red-400">{errorMsg}</p>}

      <div className="flex gap-2">
        <Button variant="outline" asChild className="flex-1">
          <Link href={`/clientes/${id}/gerar`}>Gerar mais</Link>
        </Button>
        <Button variant="ghost" asChild className="flex-1">
          <Link href={`/clientes/${id}`}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Voltar ao cliente
          </Link>
        </Button>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Check, Download, FileText, Loader2, RotateCcw, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Doc = { codigo: string; nome: string; nome_arquivo: string };
type Status = 'idle' | 'loading' | 'done' | 'error';

async function downloadBlob(url: string, filename: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(href);
}

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
      gerar();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function baixarZip() {
    setDownloadingZip(true);
    try {
      await downloadBlob(`/api/download/${packageId}`, `documentos_${packageId.slice(0, 8)}.zip`);
    } catch {
      setErrorMsg('Erro ao baixar ZIP. Tente novamente.');
    }
    setDownloadingZip(false);
  }

  async function baixarPdf(codigo: string, nomeArquivo: string) {
    setDownloadingPdf(codigo);
    try {
      await downloadBlob(`/api/download/${packageId}/pdf/${codigo}`, nomeArquivo);
    } catch {
      setErrorMsg('Erro ao baixar PDF.');
    }
    setDownloadingPdf(null);
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
          <button
            onClick={gerar}
            className="flex items-start gap-4 text-left p-5 bg-card border border-border rounded-2xl hover:border-primary/40 hover:bg-secondary/30 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground group-hover:text-primary transition-colors">Gerar PDF direto</p>
              <p className="text-sm text-muted-foreground mt-0.5">Gera e baixa os documentos imediatamente.</p>
            </div>
          </button>
          <Link
            href={`/clientes/${id}/gerar/revisar?codigos=${codigos}`}
            className="flex items-start gap-4 text-left p-5 bg-card border border-border rounded-2xl hover:border-primary/40 hover:bg-secondary/30 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round"/>
              </svg>
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-red-600 dark:text-red-400">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-foreground">Erro na geração</h1>
            <p className="text-sm text-muted-foreground">{errorMsg}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={gerar} variant="outline" className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Tentar novamente
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
      {/* Header */}
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

      {/* Lista de documentos */}
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
              <button
                onClick={() => baixarPdf(doc.codigo, doc.nome_arquivo)}
                disabled={downloadingPdf === doc.codigo}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors shrink-0 disabled:opacity-40"
              >
                {downloadingPdf === doc.codigo
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Download className="w-3.5 h-3.5" />
                }
                PDF
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Botão ZIP */}
      <Button
        onClick={baixarZip}
        disabled={downloadingZip}
        className="w-full gap-2"
        size="lg"
      >
        {downloadingZip ? (
          <><Loader2 className="w-4 h-4 animate-spin" />Baixando…</>
        ) : (
          <><Download className="w-4 h-4" />Baixar todos em ZIP</>
        )}
      </Button>

      {errorMsg && (
        <p className="text-sm text-red-600 dark:text-red-400">{errorMsg}</p>
      )}

      {/* Ações secundárias */}
      <div className="flex gap-2">
        <Button variant="outline" asChild className="flex-1">
          <Link href={`/clientes/${id}/gerar`}>Gerar mais</Link>
        </Button>
        <Button variant="ghost" asChild className="flex-1">
          <Link href={`/clientes/${id}`}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Voltar ao cliente
          </Link>
        </Button>
      </div>
    </div>
  );
}

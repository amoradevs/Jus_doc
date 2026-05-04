'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type Doc = { codigo: string; nome_arquivo: string };
type Status = 'idle' | 'loading' | 'done' | 'error';

export default function ResultadoPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const codigos = searchParams.get('codigos') ?? '';
  const modo = searchParams.get('modo') ?? 'direto';

  const [status, setStatus] = useState<Status>('idle');
  const [packageId, setPackageId] = useState('');
  const [docs, setDocs] = useState<Doc[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  function gerar() {
    const templateCodes = codigos.split(',').filter(Boolean);
    setStatus('loading');
    fetch('/api/geracao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: id, templateCodes }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.packageId) {
          setPackageId(data.packageId);
          setDocs(data.documents ?? []);
          setStatus('done');
        } else {
          setErrorMsg(data.error?.message ?? 'Erro desconhecido');
          setStatus('error');
        }
      })
      .catch(() => { setErrorMsg('Falha de rede'); setStatus('error'); });
  }

  useEffect(() => {
    if (modo === 'direto') gerar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Tela de escolha (modo revisão) ── */
  if (modo === 'revisar' && status === 'idle') {
    return (
      <div className="max-w-lg">
        <h1 className="text-2xl font-bold text-foreground mb-2">Escolha como gerar</h1>
        <p className="text-muted-foreground text-sm mb-8">
          Os dados foram coletados. Gere os PDFs direto ou revise o conteúdo antes de finalizar.
        </p>
        <div className="grid gap-4">
          <button
            onClick={gerar}
            className="flex items-start gap-4 text-left p-5 bg-card border border-border rounded-2xl hover:border-primary/40 hover:bg-secondary/30 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/>
                <path d="M13 2v7h7M9 17l2 2 4-4" strokeLinecap="round"/>
              </svg>
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
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <p className="font-semibold text-foreground group-hover:text-primary transition-colors">Revisar antes de gerar</p>
              <p className="text-sm text-muted-foreground mt-0.5">Abre os documentos para leitura e edição antes do PDF final.</p>
            </div>
          </Link>
        </div>
      </div>
    );
  }

  /* ── Loading ── */
  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-9 h-9 border-2 border-muted border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm">Gerando documentos, aguarde…</p>
      </div>
    );
  }

  /* ── Erro ── */
  if (status === 'error') {
    return (
      <div className="max-w-lg">
        <h1 className="text-xl font-bold text-destructive mb-2">Erro na geração</h1>
        <p className="text-muted-foreground text-sm mb-5">{errorMsg}</p>
        <div className="flex gap-3">
          <Button onClick={gerar} variant="outline" className="rounded-lg">Tentar novamente</Button>
          <Button variant="ghost" asChild className="rounded-lg">
            <Link href={`/clientes/${id}/gerar`}>Voltar</Link>
          </Button>
        </div>
      </div>
    );
  }

  /* ── Sucesso ── */
  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-green-600 dark:text-green-400">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round"/>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Documentos gerados</h1>
      </div>
      <p className="text-muted-foreground text-sm mb-6">
        {docs.length} documento(s) prontos para download.
      </p>

      <Button asChild className="mb-6 w-full sm:w-auto rounded-xl">
        <a href={`/api/download/${packageId}`} download>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mr-2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round"/>
          </svg>
          Baixar todos em ZIP
        </a>
      </Button>

      <div className="bg-card rounded-2xl border border-border overflow-hidden mb-8">
        {docs.map((doc, i) => (
          <div key={doc.codigo} className={`flex items-center px-5 py-3.5${i !== 0 ? ' border-t border-border' : ''}`}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-primary mr-3 shrink-0">
              <rect x="2.5" y="1.5" width="11" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M5 6h6M5 8.5h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <span className="text-sm text-foreground truncate">{doc.nome_arquivo}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" asChild className="rounded-xl">
          <Link href={`/clientes/${id}/gerar`}>Gerar mais</Link>
        </Button>
        <Button variant="ghost" asChild className="rounded-xl">
          <Link href={`/clientes/${id}`}>← Voltar ao cliente</Link>
        </Button>
      </div>
    </div>
  );
}

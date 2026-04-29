'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type Doc = { codigo: string; nome_arquivo: string };
type Status = 'loading' | 'done' | 'error';

export default function ResultadoPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const codigos = searchParams.get('codigos') ?? '';

  const [status, setStatus] = useState<Status>('loading');
  const [packageId, setPackageId] = useState('');
  const [docs, setDocs] = useState<Doc[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const templateCodes = codigos.split(',').filter(Boolean);
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
  }, [id, codigos]);

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-9 h-9 border-2 border-muted border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm">Gerando documentos, aguarde…</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="max-w-lg">
        <h1 className="text-xl font-bold text-destructive mb-2">Erro na geração</h1>
        <p className="text-muted-foreground text-sm mb-5">{errorMsg}</p>
        <Button variant="outline" asChild className="rounded-lg">
          <Link href={`/clientes/${id}/gerar`}>Tentar novamente</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-foreground mb-1">Documentos gerados</h1>
      <p className="text-muted-foreground text-sm mb-6">
        {docs.length} documento(s) prontos para download.
      </p>

      <Button asChild className="mb-6 w-full sm:w-auto rounded-xl">
        <a href={`/api/download/${packageId}`} download>Baixar todos em ZIP</a>
      </Button>

      <div className="bg-white rounded-2xl border border-border overflow-hidden mb-8">
        {docs.map((doc, i) => (
          <div
            key={doc.codigo}
            className={`flex items-center px-5 py-3.5${i !== 0 ? ' border-t border-border' : ''}`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              className="text-primary mr-3 shrink-0"
            >
              <rect x="2.5" y="1.5" width="11" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M5 6h6M5 8.5h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <span className="text-sm text-foreground truncate">{doc.nome_arquivo}</span>
          </div>
        ))}
      </div>

      <Link href={`/clientes/${id}`} className="text-sm text-primary hover:underline font-medium">
        ← Voltar ao cliente
      </Link>
    </div>
  );
}

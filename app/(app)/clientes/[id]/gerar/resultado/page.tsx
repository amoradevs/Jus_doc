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
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
        <p className="text-slate-500 text-sm">Gerando documentos, aguarde…</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="max-w-lg">
        <h1 className="text-xl font-bold text-destructive mb-2">Erro na geração</h1>
        <p className="text-slate-600 text-sm mb-4">{errorMsg}</p>
        <Button variant="outline" asChild><Link href={`/clientes/${id}/gerar`}>Tentar novamente</Link></Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Documentos gerados</h1>
      <p className="text-slate-500 text-sm mb-6">{docs.length} documento(s) prontos para download.</p>

      <Button asChild className="mb-6 w-full sm:w-auto">
        <a href={`/api/download/${packageId}`} download>Baixar todos em ZIP</a>
      </Button>

      <div className="space-y-2 mb-8">
        {docs.map((doc) => (
          <div key={doc.codigo} className="flex items-center justify-between bg-white border rounded-lg px-4 py-3">
            <span className="text-sm text-slate-700 truncate mr-3">{doc.nome_arquivo}</span>
          </div>
        ))}
      </div>

      <Link href={`/clientes/${id}`} className="text-sm text-slate-500 hover:underline">
        ← Voltar ao cliente
      </Link>
    </div>
  );
}

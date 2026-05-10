'use client';

import { useState, useTransition, useEffect } from 'react';
import { CATEGORIAS_DOCUMENTO, type CategoriaDocumento } from '@/lib/pipeline';
import { toggleDocumento, adicionarDocumento, removerDocumento } from '@/app/(app)/pipeline/actions';

type Doc = {
  id: string;
  nome: string;
  categoria: string;
  obrigatorio: boolean;
  recebido: boolean;
  recebido_em: string | null;
  observacao: string | null;
};

interface DocumentChecklistProps {
  clientId: string;
  documents: Doc[];
  nomeCliente?: string;
  telefone?: string | null;
}

export function DocumentChecklist({ clientId, documents, nomeCliente, telefone }: DocumentChecklistProps) {
  const [isPending, startTransition] = useTransition();
  const [localDocs, setLocalDocs] = useState<Doc[]>(documents);
  const [showAdd, setShowAdd] = useState(false);
  const [newNome, setNewNome] = useState('');
  const [newCategoria, setNewCategoria] = useState<CategoriaDocumento>('geral');

  // Sincroniza estado local quando o servidor revalida e envia novos props
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalDocs(documents);
  }, [documents]);

  // Agrupar por categoria
  const grouped = localDocs.reduce((acc, doc) => {
    const cat = doc.categoria as CategoriaDocumento;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(doc);
    return acc;
  }, {} as Record<CategoriaDocumento, Doc[]>);

  const total = localDocs.length;
  const recebidos = localDocs.filter((d) => d.recebido).length;
  const progress = total > 0 ? Math.round((recebidos / total) * 100) : 0;
  const obrigatoriosPendentes = localDocs.filter((d) => d.obrigatorio && !d.recebido).length;
  const pendentes = localDocs.filter((d) => !d.recebido);

  function buildWhatsAppUrl() {
    const digits = (telefone ?? '').replace(/\D/g, '');
    if (!digits) return null;
    const numero = digits.startsWith('55') ? digits : `55${digits}`;

    const firstName = (nomeCliente ?? 'cliente').split(' ')[0];

    const grouped = pendentes.reduce((acc, doc) => {
      if (!acc[doc.categoria]) acc[doc.categoria] = [];
      acc[doc.categoria].push(doc);
      return acc;
    }, {} as Record<string, Doc[]>);

    const linhas: string[] = [
      `Olá, ${firstName}!`,
      '',
      'Para avançarmos com o seu processo, preciso que você nos envie os seguintes documentos:',
      '',
    ];

    Object.entries(grouped).forEach(([cat, docs]) => {
      const label = CATEGORIAS_DOCUMENTO[cat as CategoriaDocumento] ?? cat;
      linhas.push(`*${label.toUpperCase()}*`);
      docs.forEach((d) => {
        linhas.push(`• ${d.nome}${d.obrigatorio ? ' _(obrigatório)_' : ''}`);
      });
      linhas.push('');
    });

    linhas.push('Qualquer dúvida, estou à disposição!');
    linhas.push('Att, Escritório Lidiane Abreu Advogada');

    const text = encodeURIComponent(linhas.join('\n'));
    return `https://wa.me/${numero}?text=${text}`;
  }

  const whatsappUrl = telefone ? buildWhatsAppUrl() : null;

  function handleToggle(docId: string, currentState: boolean) {
    // Atualização otimista: feedback imediato
    setLocalDocs((prev) =>
      prev.map((d) =>
        d.id === docId
          ? { ...d, recebido: !currentState, recebido_em: !currentState ? new Date().toISOString() : null }
          : d
      )
    );
    startTransition(() => {
      toggleDocumento(docId, !currentState, clientId);
    });
  }

  function handleAdd() {
    if (!newNome.trim()) return;
    startTransition(() => {
      adicionarDocumento(clientId, newNome.trim(), newCategoria, false);
    });
    setNewNome('');
    setShowAdd(false);
  }

  function handleRemove(docId: string) {
    // Atualização otimista: remove imediatamente
    setLocalDocs((prev) => prev.filter((d) => d.id !== docId));
    startTransition(() => {
      removerDocumento(docId, clientId);
    });
  }

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Header com progresso */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              📋 Documentos pendentes
            </h2>
            {whatsappUrl && pendentes.length > 0 && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={`Enviar lista de documentos pendentes via WhatsApp`}
                className="inline-flex items-center gap-1.5 text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 hover:bg-emerald-100 transition-colors dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/40 dark:hover:bg-emerald-950/50"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Enviar pendências
              </a>
            )}
            {!telefone && (
              <span
                title="Cadastre o telefone do cliente para habilitar o envio via WhatsApp"
                className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/50 cursor-help"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" className="opacity-40">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground tabular-nums">
              {recebidos}/{total}
            </span>
            {obrigatoriosPendentes > 0 && (
              <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/30">
                {obrigatoriosPendentes} obrigatório{obrigatoriosPendentes > 1 ? 's' : ''} pendente{obrigatoriosPendentes > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="h-1.5 bg-border/60 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              progress === 100
                ? 'bg-emerald-500'
                : progress >= 70
                ? 'bg-amber-500'
                : 'bg-primary'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {progress === 100 && (
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1.5 font-medium flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Todos os documentos recebidos!
          </p>
        )}
      </div>

      {/* Documentos agrupados por categoria */}
      <div className="divide-y divide-border/50">
        {Object.entries(CATEGORIAS_DOCUMENTO).map(([catKey, catLabel]) => {
          const docs = grouped[catKey as CategoriaDocumento];
          if (!docs || docs.length === 0) return null;

          const catRecebidos = docs.filter((d) => d.recebido).length;

          return (
            <div key={catKey} className="px-5 py-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[11px] font-semibold text-muted-foreground">
                  {catLabel}
                </h3>
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {catRecebidos}/{docs.length}
                </span>
              </div>

              <div className="space-y-1">
                {docs.map((doc) => (
                  <div
                    key={doc.id}
                    className={`flex items-center gap-3 py-1.5 px-2 rounded-lg transition-colors group ${
                      doc.recebido
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/10'
                        : 'hover:bg-secondary/30'
                    }`}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => handleToggle(doc.id, doc.recebido)}
                      disabled={isPending}
                      className={`w-4 h-4 rounded border-[1.5px] flex items-center justify-center shrink-0 transition-all ${
                        doc.recebido
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'border-border hover:border-primary'
                      } ${isPending ? 'opacity-50' : ''}`}
                    >
                      {doc.recebido && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>

                    {/* Nome */}
                    <span className={`text-sm flex-1 ${
                      doc.recebido
                        ? 'text-muted-foreground line-through'
                        : 'text-foreground'
                    }`}>
                      {doc.nome}
                    </span>

                    {/* Badges */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {doc.obrigatorio && !doc.recebido && (
                        <span className="text-[9px] font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded px-1 py-px dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40">
                          obrigatório
                        </span>
                      )}
                      {doc.recebido && doc.recebido_em && (
                        <span className="text-[9px] text-muted-foreground">
                          {new Date(doc.recebido_em).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                          })}
                        </span>
                      )}

                      {/* Botão remover */}
                      {!doc.obrigatorio && (
                        <button
                          onClick={() => handleRemove(doc.id)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-destructive transition-all p-0.5"
                          title="Remover documento"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round"/>
                            <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Adicionar novo documento */}
      <div className="px-5 py-3 border-t border-border">
        {showAdd ? (
          <div className="flex items-center gap-2">
            <input
              value={newNome}
              onChange={(e) => setNewNome(e.target.value)}
              placeholder="Nome do documento..."
              className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
                if (e.key === 'Escape') { setShowAdd(false); setNewNome(''); }
              }}
            />
            <select
              value={newCategoria}
              onChange={(e) => setNewCategoria(e.target.value as CategoriaDocumento)}
              className="bg-background border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {Object.entries(CATEGORIAS_DOCUMENTO).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <button
              onClick={handleAdd}
              disabled={!newNome.trim() || isPending}
              className="text-xs font-medium text-primary hover:text-primary/80 disabled:opacity-40 px-2 py-1.5"
            >
              Adicionar
            </button>
            <button
              onClick={() => { setShowAdd(false); setNewNome(''); }}
              className="text-xs text-muted-foreground hover:text-foreground px-1"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAdd(true)}
            className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round"/>
              <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round"/>
            </svg>
            Adicionar documento
          </button>
        )}
      </div>
    </div>
  );
}

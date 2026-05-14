'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, FileText, Check, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { WizardCenario } from './wizard-cenario';

type Template = {
  id: string;
  codigo: string;
  nome: string;
  familia: string;
  formato: string;
};

type Props = { clientId: string; templates?: Template[]; processoId?: string };

const FAMILIA_LABEL: Record<string, string> = {
  contrato: 'Contrato',
  procuracao: 'Procuração',
  declaracao: 'Declaração',
  termo: 'Termo',
  outro: 'Outro',
};

export function GerarModo({ clientId, templates = [], processoId }: Props) {
  const router = useRouter();
  const [busca, setBusca] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState<'direto' | 'revisar' | null>(null);

  const emBusca = busca.trim().length > 0;

  const filtrados = emBusca
    ? templates.filter((t) =>
        t.nome.toLowerCase().includes(busca.toLowerCase()) ||
        (FAMILIA_LABEL[t.familia] ?? t.familia).toLowerCase().includes(busca.toLowerCase()),
      )
    : [];

  function toggle(codigo: string) {
    setSelected((prev) =>
      prev.includes(codigo) ? prev.filter((c) => c !== codigo) : [...prev, codigo],
    );
  }

  function limpar() {
    setBusca('');
    setSelected([]);
  }

  function continuar(modo: 'direto' | 'revisar') {
    if (selected.length === 0 || loading) return;
    setLoading(modo);
    const pid = processoId ? `&processoId=${processoId}` : '';
    router.push(`/clientes/${clientId}/gerar/campos?codigos=${selected.join(',')}&modo=${modo}${pid}`);
  }

  return (
    <div className="space-y-6">

      {/* ── Busca rápida ── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Buscar documento específico…"
          value={busca}
          onChange={(e) => { setBusca(e.target.value); setSelected([]); }}
          className="pl-9 pr-9 rounded-xl"
        />
        {emBusca && (
          <button
            onClick={limpar}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Resultados da busca ── */}
      {emBusca ? (
        <div className="space-y-4">
          {filtrados.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card px-5 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhum documento encontrado para{' '}
                <strong className="text-foreground">&quot;{busca}&quot;</strong>.
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
                {filtrados.map((t) => {
                  const ativo = selected.includes(t.codigo);
                  return (
                    <button
                      key={t.id}
                      onClick={() => toggle(t.codigo)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${
                        ativo ? 'bg-primary/5' : 'hover:bg-secondary/50'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{t.nome}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {FAMILIA_LABEL[t.familia] ?? t.familia}
                          {' · '}
                          <span className="uppercase">{t.formato}</span>
                        </p>
                      </div>
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                        ativo ? 'bg-primary border-primary' : 'border-border'
                      }`}>
                        {ativo && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Barra de ação */}
              <div className={`flex items-center gap-3 transition-opacity ${
                selected.length > 0 ? 'opacity-100' : 'opacity-50 pointer-events-none'
              }`}>
                <p className="flex-1 text-sm text-muted-foreground">
                  {selected.length > 0
                    ? `${selected.length} documento${selected.length > 1 ? 's' : ''} selecionado${selected.length > 1 ? 's' : ''}`
                    : 'Selecione os documentos acima'}
                </p>
                <Button
                  variant="outline"
                  onClick={() => continuar('revisar')}
                  disabled={selected.length === 0 || !!loading}
                  className="gap-2 rounded-xl"
                >
                  {loading === 'revisar'
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : null}
                  Revisar antes
                </Button>
                <Button
                  onClick={() => continuar('direto')}
                  disabled={selected.length === 0 || !!loading}
                  className="gap-2 rounded-xl"
                >
                  {loading === 'direto'
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : null}
                  Gerar Documento
                </Button>
              </div>
            </>
          )}
        </div>
      ) : (
        /* ── Wizard (padrão quando busca está vazia) ── */
        <WizardCenario clientId={clientId} processoId={processoId} />
      )}

    </div>
  );
}

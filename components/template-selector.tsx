'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Check, Briefcase, Scale, ClipboardList, FileSignature, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Template = {
  id: string;
  codigo: string;
  nome: string;
  familia: 'contrato' | 'procuracao' | 'declaracao' | 'termo';
  formato: 'docx' | 'pdf';
};

type Props = { clientId: string; templates: Template[] };

// ── Config por família ────────────────────────────────────────────────────────

const FAMILIA: Record<string, {
  label: string;
  plural: string;
  Icon: React.ElementType;
  accent: string;
  iconBg: string;
  iconColor: string;
  badge: string;
  pill: string;
  pillAtivo: string;
  row: string;
  rowAtivo: string;
  check: string;
  checkAtivo: string;
}> = {
  contrato: {
    label: 'Contrato', plural: 'Contratos',
    Icon: Briefcase,
    accent: 'bg-blue-500',
    iconBg: 'bg-blue-100 dark:bg-blue-950/50',
    iconColor: 'text-blue-600 dark:text-blue-400',
    badge: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    pill: 'border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-400 dark:bg-blue-950/20 dark:text-blue-300 dark:border-blue-900',
    pillAtivo: 'bg-blue-600 text-white border-blue-600 dark:bg-blue-700',
    row: 'hover:bg-blue-50/50 dark:hover:bg-blue-950/10',
    rowAtivo: 'bg-blue-50 dark:bg-blue-950/20',
    check: 'border-blue-300 dark:border-blue-700',
    checkAtivo: 'bg-blue-600 border-blue-600 dark:bg-blue-700',
  },
  procuracao: {
    label: 'Procuração', plural: 'Procurações',
    Icon: Scale,
    accent: 'bg-emerald-500',
    iconBg: 'bg-emerald-100 dark:bg-emerald-950/50',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    pill: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-400 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-900',
    pillAtivo: 'bg-emerald-600 text-white border-emerald-600 dark:bg-emerald-700',
    row: 'hover:bg-emerald-50/50 dark:hover:bg-emerald-950/10',
    rowAtivo: 'bg-emerald-50 dark:bg-emerald-950/20',
    check: 'border-emerald-300 dark:border-emerald-700',
    checkAtivo: 'bg-emerald-600 border-emerald-600 dark:bg-emerald-700',
  },
  declaracao: {
    label: 'Declaração', plural: 'Declarações',
    Icon: FileSignature,
    accent: 'bg-amber-500',
    iconBg: 'bg-amber-100 dark:bg-amber-950/50',
    iconColor: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    pill: 'border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-400 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-900',
    pillAtivo: 'bg-amber-600 text-white border-amber-600 dark:bg-amber-700',
    row: 'hover:bg-amber-50/50 dark:hover:bg-amber-950/10',
    rowAtivo: 'bg-amber-50 dark:bg-amber-950/20',
    check: 'border-amber-300 dark:border-amber-700',
    checkAtivo: 'bg-amber-600 border-amber-600 dark:bg-amber-700',
  },
  termo: {
    label: 'Termo', plural: 'Termos',
    Icon: ClipboardList,
    accent: 'bg-violet-500',
    iconBg: 'bg-violet-100 dark:bg-violet-950/50',
    iconColor: 'text-violet-600 dark:text-violet-400',
    badge: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800',
    pill: 'border-violet-200 bg-violet-50 text-violet-700 hover:border-violet-400 dark:bg-violet-950/20 dark:text-violet-300 dark:border-violet-900',
    pillAtivo: 'bg-violet-600 text-white border-violet-600 dark:bg-violet-700',
    row: 'hover:bg-violet-50/50 dark:hover:bg-violet-950/10',
    rowAtivo: 'bg-violet-50 dark:bg-violet-950/20',
    check: 'border-violet-300 dark:border-violet-700',
    checkAtivo: 'bg-violet-600 border-violet-600 dark:bg-violet-700',
  },
};

const FALLBACK = FAMILIA.contrato;

const FILTROS = [
  { key: 'todas', label: 'Todos' },
  { key: 'contrato', label: 'Contratos' },
  { key: 'procuracao', label: 'Procurações' },
  { key: 'declaracao', label: 'Declarações' },
  { key: 'termo', label: 'Termos' },
] as const;

const ORDEM_FAMILIA = ['contrato', 'procuracao', 'declaracao', 'termo'];

// ── Componente ────────────────────────────────────────────────────────────────

export function TemplateSelector({ clientId, templates }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [filtro, setFiltro] = useState<string>('todas');
  const [loading, setLoading] = useState<'direto' | 'revisar' | null>(null);

  const toggle = (codigo: string) =>
    setSelected((prev) =>
      prev.includes(codigo) ? prev.filter((c) => c !== codigo) : [...prev, codigo]
    );

  const visiveis = filtro === 'todas'
    ? templates
    : templates.filter((t) => t.familia === filtro);

  // Agrupa por família mantendo ordem canônica
  const grupos: { familia: string; items: Template[] }[] = filtro === 'todas'
    ? ORDEM_FAMILIA
        .map((f) => ({ familia: f, items: templates.filter((t) => t.familia === f) }))
        .filter((g) => g.items.length > 0)
    : [{ familia: filtro, items: visiveis }];

  const toggleGrupo = (familia: string) => {
    const codigos = templates.filter((t) => t.familia === familia).map((t) => t.codigo);
    const todosAtivos = codigos.every((c) => selected.includes(c));
    if (todosAtivos) {
      setSelected((prev) => prev.filter((c) => !codigos.includes(c)));
    } else {
      setSelected((prev) => [...new Set([...prev, ...codigos])]);
    }
  };

  const continuar = (modo: 'direto' | 'revisar') => {
    if (selected.length === 0 || loading) return;
    setLoading(modo);
    router.push(`/clientes/${clientId}/gerar/campos?codigos=${selected.join(',')}&modo=${modo}`);
  };

  return (
    <div className="space-y-5">

      {/* ── Filtros ── */}
      <div className="flex flex-wrap gap-2">
        {FILTROS.map(({ key, label }) => {
          const cfg = FAMILIA[key];
          const ativo = filtro === key;
          return (
            <button
              key={key}
              onClick={() => setFiltro(key)}
              className={`px-4 py-1.5 rounded-full text-sm border font-medium transition-all ${
                ativo
                  ? cfg ? cfg.pillAtivo : 'bg-primary text-primary-foreground border-primary'
                  : cfg ? cfg.pill : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Lista agrupada ── */}
      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center">
            <FileText className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">Nenhum template cadastrado</p>
          <p className="text-xs text-muted-foreground">Adicione templates em Configurações → Templates.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {grupos.map(({ familia, items }) => {
            const cfg = FAMILIA[familia] ?? FALLBACK;
            const { Icon } = cfg;
            const codigosFamilia = items.map((t) => t.codigo);
            const todosAtivos = codigosFamilia.length > 0 && codigosFamilia.every((c) => selected.includes(c));

            return (
              <div key={familia}>
                {/* Cabeçalho do grupo (só aparece em "Todos") */}
                {filtro === 'todas' && (
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-4 rounded-full ${cfg.accent}`} />
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {cfg.plural}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleGrupo(familia)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {todosAtivos ? 'Desmarcar todos' : 'Selecionar todos'}
                    </button>
                  </div>
                )}

                {/* Itens */}
                <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
                  {items.map((t) => {
                    const ativo = selected.includes(t.codigo);
                    return (
                      <button
                        key={t.id}
                        onClick={() => toggle(t.codigo)}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${
                          ativo ? cfg.rowAtivo : cfg.row
                        }`}
                      >
                        {/* Ícone */}
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.iconBg}`}>
                          <Icon className={`w-4 h-4 ${cfg.iconColor}`} />
                        </div>

                        {/* Texto */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{t.nome}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border font-medium ${cfg.badge}`}>
                              {cfg.label}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs border font-medium bg-secondary text-muted-foreground border-border">
                              {t.formato.toUpperCase()}
                            </span>
                          </div>
                        </div>

                        {/* Checkbox */}
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                          ativo ? cfg.checkAtivo : cfg.check
                        }`}>
                          {ativo && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Barra de ação ── */}
      <div className={`sticky bottom-0 -mx-4 px-4 pb-4 pt-3 bg-background/80 backdrop-blur-sm border-t border-border transition-opacity ${
        selected.length > 0 ? 'opacity-100' : 'opacity-60 pointer-events-none'
      }`}>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            {selected.length > 0 ? (
              <p className="text-sm font-medium text-foreground">
                {selected.length} {selected.length === 1 ? 'documento selecionado' : 'documentos selecionados'}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Selecione os documentos acima</p>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => continuar('revisar')}
            disabled={selected.length === 0 || !!loading}
            className="gap-2 rounded-xl"
          >
            {loading === 'revisar' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round"/>
              </svg>
            )}
            Revisar antes
          </Button>
          <Button
            onClick={() => continuar('direto')}
            disabled={selected.length === 0 || !!loading}
            className="gap-2 rounded-xl"
          >
            {loading === 'direto' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/>
                <path d="M13 2v7h7" strokeLinecap="round"/>
              </svg>
            )}
            Gerar Documento
          </Button>
        </div>
      </div>
    </div>
  );
}

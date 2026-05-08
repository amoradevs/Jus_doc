import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { maskCPF } from '@/lib/validators/cpf';
import { labelTipoBeneficio, labelStatusResultado } from '@/lib/processo';
import { labelEtapa } from '@/lib/pipeline';
import { MoverEtapaSelect } from '@/components/mover-etapa-select';
import { ListaPrazos } from '@/components/prazos/lista-prazos';

type Props = {
  params: Promise<{ numero_interno: string }>;
  searchParams: Promise<{ tab?: string }>;
};

type ProcessoCompleto = {
  id: string;
  numero_interno: string;
  tipo_beneficio: string | null;
  etapa_pipeline: string;
  status_resultado: string;
  numero_protocolo_inss: string | null;
  numero_processo_judicial: string | null;
  data_entrada: string | null;
  dib_pleiteada: string | null;
  observacao_pipeline: string | null;
  updated_at: string;
  created_at: string;
  cliente_id: string;
  clients: {
    nome_completo: string;
    cpf: string;
    telefone: string | null;
  } | null;
};

const TABS = [
  { value: 'resumo',     label: 'Resumo' },
  { value: 'documentos', label: 'Documentos' },
  { value: 'prazos',     label: 'Prazos' },
  { value: 'andamentos', label: 'Andamentos' },
] as const;

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso.length === 10 ? iso + 'T12:00:00' : iso).toLocaleDateString('pt-BR');
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; dot: string }> = {
    deferido:              { color: 'text-emerald-700 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
    indeferido:            { color: 'text-destructive bg-destructive/5 border-destructive/20', dot: 'bg-destructive' },
    exigencia:             { color: 'text-amber-700 bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
    recurso_administrativo:{ color: 'text-violet-700 bg-violet-50 border-violet-200', dot: 'bg-violet-500' },
    judicializado:         { color: 'text-rose-700 bg-rose-50 border-rose-200', dot: 'bg-rose-500' },
    arquivado:             { color: 'text-gray-600 bg-gray-50 border-gray-200', dot: 'bg-gray-400' },
    em_andamento:          { color: 'text-primary bg-primary/5 border-primary/20', dot: 'bg-primary/60' },
  };
  const s = map[status] ?? map.em_andamento;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium border rounded-full px-2.5 py-0.5 ${s.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
      {labelStatusResultado(status)}
    </span>
  );
}

export default async function ProcessoPage({ params, searchParams }: Props) {
  const user = await getCurrentUser();
  const { numero_interno } = await params;
  const { tab = 'resumo' } = await searchParams;

  const { data: processoData, error } = await db
    .from('processos')
    .select(`
      id,
      numero_interno,
      tipo_beneficio,
      etapa_pipeline,
      status_resultado,
      numero_protocolo_inss,
      numero_processo_judicial,
      data_entrada,
      dib_pleiteada,
      observacao_pipeline,
      updated_at,
      created_at,
      cliente_id,
      clients(nome_completo, cpf, telefone)
    `)
    .eq('numero_interno', numero_interno)
    .eq('tenant_id', user.tenantId)
    .single();

  if (error || !processoData) notFound();

  const processo = processoData as unknown as ProcessoCompleto;
  const client = processo.clients;
  if (!client) notFound();

  // Dados extras por aba
  let packages: { id: string; criado_em: string; expira_em: string; templates_usados: string[] }[] = [];
  if (tab === 'documentos') {
    const { data } = await db
      .from('generation_packages')
      .select('id, criado_em, expira_em, templates_usados')
      .eq('client_id', processo.cliente_id)
      .eq('tenant_id', user.tenantId)
      .order('criado_em', { ascending: false })
      .limit(20);
    packages = (data ?? []) as typeof packages;
  }

  const agora = new Date();

  return (
    <div>
      {/* Breadcrumb contextual */}
      <Link
        href={`/clientes/${processo.cliente_id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {client.nome_completo}
        <span className="text-muted-foreground/40 mx-1">·</span>
        <span className="font-mono text-xs">{maskCPF(client.cpf)}</span>
        {client.telefone && (
          <>
            <span className="text-muted-foreground/40 mx-1">·</span>
            <span>{client.telefone}</span>
          </>
        )}
      </Link>

      {/* Título */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <span className="font-mono text-sm font-semibold text-primary">{processo.numero_interno}</span>
          <StatusBadge status={processo.status_resultado} />
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          {labelTipoBeneficio(processo.tipo_beneficio)}
        </h1>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-0 border-b border-border mb-6">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={`/processos/${numero_interno}?tab=${t.value}`}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.value
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* ── Aba: Resumo ─────────────────────────────────────────────── */}
      {tab === 'resumo' && (
        <div className="space-y-6">
          {/* Dados do processo */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
              Dados do processo
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-3">
              <DataRow label="Tipo de benefício" value={labelTipoBeneficio(processo.tipo_beneficio)} />
              <DataRow label="Status atual" value={labelStatusResultado(processo.status_resultado)} />
              <DataRow label="Data de entrada" value={fmtDate(processo.data_entrada)} />
              <DataRow label="DIB pleiteada" value={fmtDate(processo.dib_pleiteada)} />
              <DataRow label="Nº protocolo INSS" value={processo.numero_protocolo_inss ?? '—'} />
              <DataRow label="Nº processo judicial" value={processo.numero_processo_judicial ?? '—'} />
              <DataRow label="Cadastrado em" value={fmtDate(processo.created_at)} />
              <DataRow label="Última atualização" value={fmtDate(processo.updated_at)} />
            </div>

            {processo.observacao_pipeline && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1">Observação</p>
                <p className="text-sm text-foreground">{processo.observacao_pipeline}</p>
              </div>
            )}
          </div>

          {/* Etapa no Pipeline */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
              Etapa no Pipeline
            </h2>
            <div className="flex items-center gap-4">
              <div className="text-sm text-foreground font-medium">{labelEtapa(processo.etapa_pipeline)}</div>
              <MoverEtapaSelect processoId={processo.id} etapaAtual={processo.etapa_pipeline} />
            </div>
          </div>

          {/* Ações */}
          <div className="flex flex-wrap gap-3">
            <Button asChild className="rounded-xl">
              <Link href={`/clientes/${processo.cliente_id}/gerar`}>
                Gerar documentos
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl border-border">
              <Link href={`/clientes/${processo.cliente_id}`}>
                Ver dados do cliente
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* ── Aba: Documentos ─────────────────────────────────────────── */}
      {tab === 'documentos' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              Pacotes gerados para este cliente.
            </p>
            <Button asChild size="sm" variant="outline" className="rounded-lg border-border text-xs h-7">
              <Link href={`/clientes/${processo.cliente_id}/gerar`}>+ Gerar documentos</Link>
            </Button>
          </div>

          {packages.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-14 text-center">
              <p className="text-muted-foreground text-sm">Nenhum pacote gerado ainda.</p>
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              {packages.map((pkg, i) => {
                const expirado = new Date(pkg.expira_em) < agora;
                return (
                  <div
                    key={pkg.id}
                    className={`flex items-center justify-between px-5 py-4 hover:bg-secondary/20 transition-colors${i !== 0 ? ' border-t border-border' : ''}`}
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {new Date(pkg.criado_em).toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {pkg.templates_usados.length} documento(s)
                      </p>
                    </div>
                    {expirado ? (
                      <span className="text-xs text-muted-foreground border border-border rounded-lg px-2.5 py-1">
                        Expirado
                      </span>
                    ) : (
                      <Button asChild size="sm" variant="outline" className="rounded-lg border-border text-xs h-7">
                        <Link href={`/api/download/${pkg.id}`}>Baixar</Link>
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Aba: Prazos ─────────────────────────────────────────────── */}
      {tab === 'prazos' && (
        <ListaPrazos processoId={processo.id} />
      )}

      {/* ── Aba: Andamentos (stub) ──────────────────────────────────── */}
      {tab === 'andamentos' && (
        <div className="bg-card rounded-2xl border border-dashed border-border p-14 text-center">
          <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground">
              <line x1="8" y1="6" x2="21" y2="6"/>
              <line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/>
              <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </div>
          <p className="text-sm font-medium text-foreground mb-1">Histórico de andamentos</p>
          <p className="text-xs text-muted-foreground">
            Timeline de notas e atualizações estará disponível em breve.
          </p>
        </div>
      )}
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 text-sm">
      <span className="text-muted-foreground text-xs pt-0.5 w-40 shrink-0">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

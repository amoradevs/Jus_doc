import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import Link from 'next/link';
import { maskCPF } from '@/lib/validators/cpf';
import { labelTipoBeneficio, labelStatusResultado, STATUS_RESULTADO } from '@/lib/processo';
import { StatusBadge } from '@/components/status-badge';

type ProcessoRow = {
  id: string;
  numero_interno: string;
  tipo_beneficio: string | null;
  status_resultado: string;
  clients: { nome_completo: string; cpf: string } | null;
};

type Props = {
  searchParams: Promise<{ status?: string }>;
};

export default async function ProcessosPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  const { status } = await searchParams;

  const statusValido = STATUS_RESULTADO.some((s) => s.value === status) ? status : undefined;

  let query = db
    .from('processos')
    .select('id, numero_interno, tipo_beneficio, status_resultado, clients!inner(nome_completo, cpf, deletado_em)')
    .eq('tenant_id', user.tenantId)
    .is('clients.deletado_em', null)
    .order('updated_at', { ascending: false });

  if (statusValido) {
    query = query.eq('status_resultado', statusValido);
  }

  const { data } = await query;
  const processos = (data ?? []) as unknown as ProcessoRow[];

  const titulo = statusValido ? labelStatusResultado(statusValido) : 'Todos os processos';

  return (
    <div>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Painel
      </Link>

      <h1 className="text-2xl font-bold text-foreground mb-1">Processos — {titulo}</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {processos.length} processo{processos.length === 1 ? '' : 's'}
      </p>

      {processos.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-14 flex flex-col items-center text-center">
          <p className="text-muted-foreground text-sm">Nenhum processo encontrado.</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {processos.map((p, i) => (
            <Link
              key={p.id}
              href={`/processos/${p.numero_interno}`}
              className={`flex items-center gap-4 px-5 py-4 hover:bg-secondary/40 transition-colors group${i !== 0 ? ' border-t border-border' : ''}`}
            >
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-sm font-semibold text-primary">
                  {(p.clients?.nome_completo ?? '—').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">{p.clients?.nome_completo ?? '—'}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {maskCPF(p.clients?.cpf ?? '')}
                  {' · '}{labelTipoBeneficio(p.tipo_beneficio)}
                  {' · '}{p.numero_interno}
                </p>
              </div>
              <StatusBadge status={p.status_resultado} />
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/40 shrink-0 group-hover:text-muted-foreground transition-colors">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

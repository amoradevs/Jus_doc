import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import Link from 'next/link';
import { maskCPF } from '@/lib/validators/cpf';
import { FiltroPeriodo } from '@/components/dashboard/filtro-periodo';
import { CalendarioSemanal } from '@/components/dashboard/calendario-semanal';

type RecentClient = {
  id: string;
  nome_completo: string;
  cpf: string;
  endereco_cidade: string;
  endereco_uf: string;
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; ano?: string }>;
}) {
  const { mes, ano } = await searchParams;
  const user = await getCurrentUser();
  const firstName = 'Doutores';
  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'America/Sao_Paulo',
  });

  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth() + 1;
  const mesParam = mes ? parseInt(mes) : mesAtual;
  const anoParam = ano ? parseInt(ano) : anoAtual;

  let dateStart: string | null = null;
  let dateEnd: string | null = null;

  if (anoParam) {
    const m = mesParam;
    if (m && m >= 1 && m <= 12) {
      dateStart = new Date(anoParam, m - 1, 1).toISOString();
      dateEnd = new Date(anoParam, m, 0, 23, 59, 59, 999).toISOString();
    } else {
      dateStart = new Date(anoParam, 0, 1).toISOString();
      dateEnd = new Date(anoParam, 11, 31, 23, 59, 59, 999).toISOString();
    }
  } else if (mesParam && mesParam >= 1 && mesParam <= 12) {
    dateStart = new Date(anoAtual, mesParam - 1, 1).toISOString();
    dateEnd = new Date(anoAtual, mesParam, 0, 23, 59, 59, 999).toISOString();
  }

  const filtrado = !!(dateStart && dateEnd);

  // Clientes: conta sempre (sem filtro de data)
  const qTotal = db
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', user.tenantId)
    .is('deletado_em', null);

  // KPIs de processo — filtráveis por data de criação do processo
  const qDeferidos = filtrado
    ? db.from('processos').select('*, clients!inner(deletado_em)', { count: 'exact', head: true }).eq('tenant_id', user.tenantId).eq('status_resultado', 'deferido').is('clients.deletado_em', null).gte('created_at', dateStart!).lte('created_at', dateEnd!)
    : db.from('processos').select('*, clients!inner(deletado_em)', { count: 'exact', head: true }).eq('tenant_id', user.tenantId).eq('status_resultado', 'deferido').is('clients.deletado_em', null);

  const qIndeferidos = filtrado
    ? db.from('processos').select('*, clients!inner(deletado_em)', { count: 'exact', head: true }).eq('tenant_id', user.tenantId).eq('status_resultado', 'indeferido').is('clients.deletado_em', null).gte('created_at', dateStart!).lte('created_at', dateEnd!)
    : db.from('processos').select('*, clients!inner(deletado_em)', { count: 'exact', head: true }).eq('tenant_id', user.tenantId).eq('status_resultado', 'indeferido').is('clients.deletado_em', null);

  const qAndamento = filtrado
    ? db.from('processos').select('*, clients!inner(deletado_em)', { count: 'exact', head: true }).eq('tenant_id', user.tenantId).eq('status_resultado', 'em_andamento').is('clients.deletado_em', null).gte('created_at', dateStart!).lte('created_at', dateEnd!)
    : db.from('processos').select('*, clients!inner(deletado_em)', { count: 'exact', head: true }).eq('tenant_id', user.tenantId).eq('status_resultado', 'em_andamento').is('clients.deletado_em', null);

  const qRecentes = db
    .from('clients')
    .select('id,nome_completo,cpf,endereco_cidade,endereco_uf')
    .eq('tenant_id', user.tenantId)
    .is('deletado_em', null)
    .order('criado_em', { ascending: false })
    .limit(3);

  const [
    { count: total },
    { count: deferidos },
    { count: indeferidos },
    { count: andamento },
    { data: recentes },
  ] = await Promise.all([qTotal, qDeferidos, qIndeferidos, qAndamento, qRecentes]);

  const lista = (recentes ?? []) as RecentClient[];

  const labelPeriodo = filtrado
    ? mesParam && anoParam
      ? `${['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][(mesParam ?? 1) - 1]} de ${anoParam}`
      : mesParam
      ? `${['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][(mesParam ?? 1) - 1]} de ${anoAtual}`
      : `${anoParam}`
    : null;

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs text-muted-foreground mb-0.5 capitalize">{today}</p>
        <h1 className="text-2xl font-bold text-foreground">Olá, {firstName}</h1>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-y-3 mb-5">
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Visão Geral
          </h2>
          {labelPeriodo && (
            <p className="text-[10px] text-muted-foreground mt-0.5">{labelPeriodo}</p>
          )}
        </div>
        <FiltroPeriodo mesAtivo={mesParam} anoAtivo={anoParam} anoAtual={anoAtual} isPadrao={!mes && !ano} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        <MetricCard
          label="Total de clientes"
          value={total ?? 0}
          numClass="text-foreground"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          }
        />
        <MetricCard
          label="Processos ativos"
          value={andamento ?? 0}
          numClass="text-primary"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          }
        />
        <MetricCard
          label="Deferidos"
          value={deferidos ?? 0}
          numClass="text-emerald-600 dark:text-emerald-400"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          }
        />
        <MetricCard
          label="Indeferidos"
          value={indeferidos ?? 0}
          numClass="text-destructive"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          }
        />
      </div>

      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
        Clientes recentes
      </h2>

      {lista.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-14 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mb-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <p className="text-muted-foreground text-sm">Nenhum cliente cadastrado ainda.</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {lista.map((c, i) => (
            <Link
              key={c.id}
              href={`/clientes/${c.id}`}
              className={`flex items-center gap-4 px-5 py-4 hover:bg-secondary/40 transition-colors group${i !== 0 ? ' border-t border-border' : ''}`}
            >
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-sm font-semibold text-primary">
                  {c.nome_completo.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">{c.nome_completo}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {maskCPF(c.cpf)}
                  {' · '}{c.endereco_cidade}/{c.endereco_uf}
                </p>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/40 shrink-0 group-hover:text-muted-foreground transition-colors">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-10">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
          Agenda da semana
        </h2>
        <CalendarioSemanal />
      </div>
    </div>
  );
}

function MetricCard({ label, value, numClass, icon }: { label: string; value: number; numClass: string; icon: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="text-muted-foreground/50 mb-3">{icon}</div>
      <p className={`text-3xl font-bold tabular-nums ${numClass}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1 leading-tight">{label}</p>
    </div>
  );
}

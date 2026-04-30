import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import Link from 'next/link';
import { labelTipoPedido } from '@/lib/processo';
import { FiltroPeriodo } from '@/components/dashboard/filtro-periodo';

type RecentClient = {
  id: string;
  nome_completo: string;
  cpf: string;
  status_pedido: string | null;
  tipo_pedido: string | null;
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
  const firstName = user.name?.split(' ')[0] ?? 'Advogada';
  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'America/Sao_Paulo',
  });

  const anoAtual = new Date().getFullYear();
  const mesParam = mes ? parseInt(mes) : null;
  const anoParam = ano ? parseInt(ano) : null;

  // Calcula intervalo de datas para o filtro
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

  const t = db.from('clients');

  const qTotal = filtrado
    ? t.select('*', { count: 'exact', head: true }).eq('tenant_id', user.tenantId).is('deletado_em', null).gte('criado_em', dateStart!).lte('criado_em', dateEnd!)
    : t.select('*', { count: 'exact', head: true }).eq('tenant_id', user.tenantId).is('deletado_em', null);

  const qDeferidos = filtrado
    ? db.from('clients').select('*', { count: 'exact', head: true }).eq('tenant_id', user.tenantId).is('deletado_em', null).eq('status_pedido', 'deferido').gte('criado_em', dateStart!).lte('criado_em', dateEnd!)
    : db.from('clients').select('*', { count: 'exact', head: true }).eq('tenant_id', user.tenantId).is('deletado_em', null).eq('status_pedido', 'deferido');

  const qIndeferidos = filtrado
    ? db.from('clients').select('*', { count: 'exact', head: true }).eq('tenant_id', user.tenantId).is('deletado_em', null).eq('status_pedido', 'indeferido').gte('criado_em', dateStart!).lte('criado_em', dateEnd!)
    : db.from('clients').select('*', { count: 'exact', head: true }).eq('tenant_id', user.tenantId).is('deletado_em', null).eq('status_pedido', 'indeferido');

  const qRecentes = filtrado
    ? db.from('clients').select('id,nome_completo,cpf,status_pedido,tipo_pedido,endereco_cidade,endereco_uf').eq('tenant_id', user.tenantId).is('deletado_em', null).gte('criado_em', dateStart!).lte('criado_em', dateEnd!).order('criado_em', { ascending: false }).limit(5)
    : db.from('clients').select('id,nome_completo,cpf,status_pedido,tipo_pedido,endereco_cidade,endereco_uf').eq('tenant_id', user.tenantId).is('deletado_em', null).order('atualizado_em', { ascending: false }).limit(5);

  const [
    { count: total },
    { count: deferidos },
    { count: indeferidos },
    { data: recentes },
  ] = await Promise.all([qTotal, qDeferidos, qIndeferidos, qRecentes]);

  const lista = (recentes ?? []) as RecentClient[];
  const emAndamento = (total ?? 0) - (deferidos ?? 0) - (indeferidos ?? 0);

  const labelPeriodo = filtrado
    ? mesParam && anoParam
      ? `${['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][(mesParam ?? 1) - 1]} de ${anoParam}`
      : mesParam
      ? `${['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][(mesParam ?? 1) - 1]} de ${anoAtual}`
      : `${anoParam}`
    : null;

  return (
    <div>
      {/* Boas-vindas */}
      <div className="mb-8">
        <p className="text-xs text-muted-foreground mb-0.5 capitalize">{today}</p>
        <h1 className="text-2xl font-bold text-foreground">Olá, {firstName}</h1>
      </div>

      {/* Cabeçalho métricas + filtro */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            {filtrado ? `Métricas — ${labelPeriodo}` : 'Visão geral'}
          </h2>
          {filtrado && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Clientes cadastrados neste período
            </p>
          )}
        </div>
        <FiltroPeriodo mesAtivo={mesParam} anoAtivo={anoParam} anoAtual={anoAtual} />
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        <MetricCard
          label={filtrado ? 'Novos clientes' : 'Total de clientes'}
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
          label="Em andamento"
          value={emAndamento}
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

      {/* Lista de clientes */}
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
        {filtrado ? `Clientes — ${labelPeriodo}` : 'Clientes recentes'}
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
          <p className="text-muted-foreground text-sm">
            {filtrado ? 'Nenhum cliente neste período.' : 'Nenhum cliente cadastrado ainda.'}
          </p>
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
                  {c.tipo_pedido ? labelTipoPedido(c.tipo_pedido) : 'Sem benefício definido'}
                  {' · '}{c.endereco_cidade}/{c.endereco_uf}
                </p>
              </div>
              <StatusBadge status={c.status_pedido} />
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

function MetricCard({ label, value, numClass, icon }: { label: string; value: number; numClass: string; icon: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="text-muted-foreground/50 mb-3">{icon}</div>
      <p className={`text-3xl font-bold tabular-nums ${numClass}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1 leading-tight">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  if (status === 'deferido') return (
    <span className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5 shrink-0 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
      Deferido
    </span>
  );
  if (status === 'indeferido') return (
    <span className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-destructive bg-destructive/5 border border-destructive/20 rounded-full px-2 py-0.5 shrink-0">
      <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
      Indeferido
    </span>
  );
  return (
    <span className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5 shrink-0">
      <span className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
      Andamento
    </span>
  );
}

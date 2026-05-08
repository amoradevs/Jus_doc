import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { maskCPF, unmaskCPF } from '@/lib/validators/cpf';
import { ClientFilters } from '@/components/client-filters';
import { labelTipoBeneficio, labelStatusResultado } from '@/lib/processo';
import { ExportarClientes } from '@/components/exportar-clientes';
import { Suspense } from 'react';

type Props = {
  searchParams: Promise<{
    search?: string;
    page?: string;
    status?: string;
    cidade?: string;
    sort?: string;
  }>;
};

type Client = {
  id: string;
  nome_completo: string;
  cpf: string;
  criado_em: string;
  endereco_cidade: string;
  endereco_uf: string;
};

type Processo = {
  cliente_id: string;
  tipo_beneficio: string | null;
  status_resultado: string;
};

function ProcessosBadge({ processos }: { processos: Processo[] }) {
  if (processos.length === 0) {
    return <span className="text-xs text-muted-foreground">Sem processo</span>;
  }

  if (processos.length === 1) {
    const p = processos[0];
    const colorClass =
      p.status_resultado === 'deferido'
        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
        : p.status_resultado === 'indeferido'
          ? 'text-destructive bg-destructive/5 border-destructive/20'
          : p.status_resultado === 'exigencia'
            ? 'text-amber-700 bg-amber-50 border-amber-200'
            : 'text-muted-foreground bg-secondary border-border';
    const dotClass =
      p.status_resultado === 'deferido'
        ? 'bg-emerald-500'
        : p.status_resultado === 'indeferido'
          ? 'bg-destructive'
          : p.status_resultado === 'exigencia'
            ? 'bg-amber-500'
            : 'bg-muted-foreground/50';

    return (
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground leading-snug">
          {labelTipoBeneficio(p.tipo_beneficio)}
        </span>
        <span className={`inline-flex items-center gap-1 text-xs font-medium border rounded-full px-2 py-0.5 w-fit ${colorClass}`}>
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />
          {labelStatusResultado(p.status_resultado)}
        </span>
      </div>
    );
  }

  // 2+ processos
  const hasIndeferido = processos.some((p) => p.status_resultado === 'indeferido');
  const hasExigencia = processos.some((p) => p.status_resultado === 'exigencia');
  const allDeferido = processos.every((p) => p.status_resultado === 'deferido');
  const dotClass = hasIndeferido
    ? 'bg-destructive'
    : hasExigencia
      ? 'bg-amber-500'
      : allDeferido
        ? 'bg-emerald-500'
        : 'bg-muted-foreground/50';

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />
      {processos.length} processos
    </span>
  );
}

export default async function ClientesPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  const { search = '', page = '1', status = '', cidade = '', sort = '' } = await searchParams;
  const pageNum = parseInt(page);
  const limit = 20;
  const offset = (pageNum - 1) * limit;

  // Filtro por status: resolve quais client_ids têm processos com o status pedido
  let clientIdsFromStatus: string[] | null = null;
  if (status === 'deferido' || status === 'indeferido' || status === 'andamento') {
    const statusValue =
      status === 'deferido' ? 'deferido'
        : status === 'indeferido' ? 'indeferido'
          : 'em_andamento';

    const { data: processoRows } = await db
      .from('processos')
      .select('cliente_id')
      .eq('tenant_id', user.tenantId)
      .eq('status_resultado', statusValue);

    clientIdsFromStatus = (processoRows ?? []).map((r: { cliente_id: string }) => r.cliente_id);
  }

  // Se o filtro de status não encontrou nenhum processo, lista vazia
  const noMatches = clientIdsFromStatus !== null && clientIdsFromStatus.length === 0;

  let lista: Client[] = [];
  let processoMap = new Map<string, Processo[]>();

  if (!noMatches) {
    let query = db
      .from('clients')
      .select('id, nome_completo, cpf, criado_em, endereco_cidade, endereco_uf')
      .eq('tenant_id', user.tenantId)
      .is('deletado_em', null)
      .range(offset, offset + limit - 1);

    if (search) {
      const term = unmaskCPF(search);
      query = query.or(`nome_completo.ilike.%${search}%,cpf.ilike.%${term}%`);
    }

    if (clientIdsFromStatus !== null) {
      query = query.in('id', clientIdsFromStatus);
    }

    if (cidade) query = query.ilike('endereco_cidade', `%${cidade}%`);

    if (sort === 'nome') query = query.order('nome_completo', { ascending: true });
    else if (sort === 'antigos') query = query.order('criado_em', { ascending: true });
    else query = query.order('criado_em', { ascending: false });

    const { data: rows } = await query;
    lista = (rows ?? []) as Client[];

    // Busca processos dos clientes listados e monta mapa cliente_id → processos
    if (lista.length > 0) {
      const ids = lista.map((c) => c.id);
      const { data: processoRows } = await db
        .from('processos')
        .select('cliente_id, tipo_beneficio, status_resultado')
        .eq('tenant_id', user.tenantId)
        .in('cliente_id', ids);

      for (const p of (processoRows ?? []) as Processo[]) {
        const list = processoMap.get(p.cliente_id) ?? [];
        list.push(p);
        processoMap.set(p.cliente_id, list);
      }
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
        <div className="flex items-center gap-2">
          <ExportarClientes />
          <Button asChild className="rounded-xl">
            <Link href="/clientes/novo">+ Novo cliente</Link>
          </Button>
        </div>
      </div>

      {/* Busca por nome/CPF */}
      <form method="GET" className="mb-4">
        <input
          name="search"
          defaultValue={search}
          placeholder="Buscar por nome ou CPF…"
          className="w-full sm:w-80 bg-white border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-colors"
        />
        {status && <input type="hidden" name="status" value={status} />}
        {cidade && <input type="hidden" name="cidade" value={cidade} />}
        {sort && <input type="hidden" name="sort" value={sort} />}
      </form>

      {/* Filtros e ordenação */}
      <Suspense>
        <ClientFilters />
      </Suspense>

      {lista.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-14 text-center">
          <p className="text-muted-foreground text-sm">Nenhum cliente encontrado.</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Nome
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  CPF
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Cidade
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Processos
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Cadastro
                </th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {lista.map((c) => (
                <tr key={c.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/clientes/${c.id}`}
                      className="font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {c.nome_completo}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground font-mono text-xs">
                    {maskCPF(c.cpf)}
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">
                    {c.endereco_cidade} / {c.endereco_uf}
                  </td>
                  <td className="px-5 py-3.5">
                    <ProcessosBadge processos={processoMap.get(c.id) ?? []} />
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">
                    {new Date(c.criado_em).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/clientes/${c.id}`}
                        className="text-xs text-primary hover:underline font-semibold"
                      >
                        Abrir
                      </Link>
                      <Link
                        href={`/clientes/${c.id}/editar`}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Editar
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(pageNum > 1 || lista.length === limit) && (
        <div className="flex items-center gap-4 mt-5">
          {pageNum > 1 && (
            <Link
              href={`/clientes?search=${search}&status=${status}&cidade=${cidade}&sort=${sort}&page=${pageNum - 1}`}
              className="text-sm text-primary hover:underline font-medium"
            >
              ← Anterior
            </Link>
          )}
          {lista.length === limit && (
            <Link
              href={`/clientes?search=${search}&status=${status}&cidade=${cidade}&sort=${sort}&page=${pageNum + 1}`}
              className="text-sm text-primary hover:underline font-medium ml-auto"
            >
              Próxima →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

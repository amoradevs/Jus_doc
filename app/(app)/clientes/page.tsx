import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { maskCPF, unmaskCPF } from '@/lib/validators/cpf';
import { ClientFilters } from '@/components/client-filters';
import { labelTipoPedido } from '@/lib/processo';
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
  tipo_pedido: string | null;
  status_pedido: string | null;
  data_entrada_pedido: string | null;
};

function StatusBadge({ status }: { status: string | null }) {
  if (status === 'deferido') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
        Deferido
      </span>
    );
  }
  if (status === 'indeferido') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive bg-destructive/5 border border-destructive/20 rounded-full px-2 py-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
        Indeferido
      </span>
    );
  }
  return (
    <span className="text-xs text-muted-foreground">Em andamento</span>
  );
}

export default async function ClientesPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  const { search = '', page = '1', status = '', cidade = '', sort = '' } = await searchParams;
  const pageNum = parseInt(page);
  const limit = 20;
  const offset = (pageNum - 1) * limit;

  let query = db
    .from('clients')
    .select('*')
    .eq('tenant_id', user.tenantId)
    .is('deletado_em', null)
    .range(offset, offset + limit - 1);

  // Busca por nome ou CPF
  if (search) {
    const term = unmaskCPF(search);
    query = query.or(`nome_completo.ilike.%${search}%,cpf.ilike.%${term}%`);
  }

  // Filtro por status
  if (status === 'deferido') query = query.eq('status_pedido', 'deferido');
  else if (status === 'indeferido') query = query.eq('status_pedido', 'indeferido');
  else if (status === 'andamento') query = query.is('status_pedido', null);

  // Filtro por cidade
  if (cidade) query = query.ilike('endereco_cidade', `%${cidade}%`);

  // Ordenação
  if (sort === 'nome') query = query.order('nome_completo', { ascending: true });
  else if (sort === 'antigos') query = query.order('criado_em', { ascending: true });
  else if (sort === 'pedido') query = query.order('data_entrada_pedido', { ascending: false });
  else query = query.order('criado_em', { ascending: false });

  const { data: rows } = await query;
  const lista = (rows ?? []) as Client[];

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
        {/* Preserva filtros ao buscar */}
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
                  Status
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
                    <Link href={`/clientes/${c.id}`} className="font-medium text-foreground hover:text-primary transition-colors">
                      {c.nome_completo}
                    </Link>
                    {c.tipo_pedido && (
                      <p className="text-xs text-muted-foreground mt-0.5">{labelTipoPedido(c.tipo_pedido)}</p>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground font-mono text-xs">{maskCPF(c.cpf)}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">
                    {c.endereco_cidade} / {c.endereco_uf}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={c.status_pedido} />
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

import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { maskCPF, unmaskCPF } from '@/lib/validators/cpf';

type Props = { searchParams: Promise<{ search?: string; page?: string }> };

export default async function ClientesPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  const { search = '', page = '1' } = await searchParams;
  const pageNum = parseInt(page);
  const limit = 20;
  const offset = (pageNum - 1) * limit;

  let query = db
    .from('clients')
    .select('*')
    .eq('tenant_id', user.tenantId)
    .is('deletado_em', null)
    .order('atualizado_em', { ascending: true })
    .range(offset, offset + limit - 1);

  if (search) {
    const term = unmaskCPF(search);
    query = query.or(`nome_completo.ilike.%${search}%,cpf.ilike.%${term}%`);
  }

  const { data: rows } = await query;
  const lista = rows ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
        <Button asChild className="rounded-xl">
          <Link href="/clientes/novo">+ Novo cliente</Link>
        </Button>
      </div>

      <form method="GET" className="mb-5">
        <input
          name="search"
          defaultValue={search}
          placeholder="Buscar por nome ou CPF…"
          className="w-full sm:w-80 bg-white border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-colors"
        />
      </form>

      {lista.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-14 text-center">
          <p className="text-muted-foreground text-sm">Nenhum cliente encontrado.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
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
                  Cadastro
                </th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {lista.map((c: { id: string; nome_completo: string; cpf: string; criado_em: string }) => (
                <tr key={c.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-foreground">{c.nome_completo}</td>
                  <td className="px-5 py-3.5 text-muted-foreground font-mono text-xs">{maskCPF(c.cpf)}</td>
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
              href={`/clientes?search=${search}&page=${pageNum - 1}`}
              className="text-sm text-primary hover:underline font-medium"
            >
              ← Anterior
            </Link>
          )}
          {lista.length === limit && (
            <Link
              href={`/clientes?search=${search}&page=${pageNum + 1}`}
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

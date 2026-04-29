import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { clients } from '@/lib/db/schema';
import { eq, and, or, ilike, isNull } from 'drizzle-orm';
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

  const searchFilter = search
    ? or(ilike(clients.nome_completo, `%${search}%`), ilike(clients.cpf, `%${unmaskCPF(search)}%`))
    : undefined;

  const rows = await db
    .select()
    .from(clients)
    .where(and(eq(clients.tenant_id, user.tenantId), isNull(clients.deletado_em), searchFilter))
    .orderBy(clients.atualizado_em)
    .limit(limit)
    .offset(offset);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Clientes</h1>
        <Button asChild><Link href="/clientes/novo">+ Novo cliente</Link></Button>
      </div>

      <form method="GET" className="mb-4">
        <input
          name="search"
          defaultValue={search}
          placeholder="Buscar por nome ou CPF…"
          className="w-full sm:w-80 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
      </form>

      {rows.length === 0 ? (
        <p className="text-slate-500 text-sm">Nenhum cliente encontrado.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-slate-500">
              <tr>
                <th className="pb-2 font-medium">Nome</th>
                <th className="pb-2 font-medium">CPF</th>
                <th className="pb-2 font-medium">Cadastro</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="py-3">{c.nome_completo}</td>
                  <td className="py-3 text-slate-600">{maskCPF(c.cpf)}</td>
                  <td className="py-3 text-slate-400">{new Date(c.criado_em).toLocaleDateString('pt-BR')}</td>
                  <td className="py-3 text-right">
                    <Link href={`/clientes/${c.id}`} className="text-slate-700 hover:underline mr-3">Abrir</Link>
                    <Link href={`/clientes/${c.id}/editar`} className="text-slate-500 hover:underline">Editar</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex gap-2 mt-4">
        {pageNum > 1 && (
          <Link href={`/clientes?search=${search}&page=${pageNum - 1}`} className="text-sm text-slate-600 hover:underline">← Anterior</Link>
        )}
        {rows.length === limit && (
          <Link href={`/clientes?search=${search}&page=${pageNum + 1}`} className="text-sm text-slate-600 hover:underline ml-auto">Próxima →</Link>
        )}
      </div>
    </div>
  );
}

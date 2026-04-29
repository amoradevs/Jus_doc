import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { maskCPF } from '@/lib/validators/cpf';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  const { data: recentes } = await db
    .from('clients')
    .select('*')
    .eq('tenant_id', user.tenantId)
    .is('deletado_em', null)
    .order('atualizado_em', { ascending: false })
    .limit(10);

  const lista = recentes ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Clientes recentes</h1>
        <Button asChild><Link href="/clientes/novo">+ Novo cliente</Link></Button>
      </div>

      {lista.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="mb-3">Nenhum cliente cadastrado ainda.</p>
          <Button asChild variant="outline"><Link href="/clientes/novo">Cadastrar primeiro cliente</Link></Button>
        </div>
      ) : (
        <div className="space-y-2">
          {lista.map((c: { id: string; nome_completo: string; cpf: string }) => (
            <div key={c.id} className="bg-white border rounded-lg px-4 py-3 flex items-center justify-between hover:shadow-sm transition-shadow">
              <div>
                <p className="font-medium text-slate-800">{c.nome_completo}</p>
                <p className="text-xs text-slate-400 mt-0.5">{maskCPF(c.cpf)}</p>
              </div>
              <Button asChild size="sm" variant="outline"><Link href={`/clientes/${c.id}`}>Abrir</Link></Button>
            </div>
          ))}
        </div>
      )}

      {lista.length > 0 && (
        <Link href="/clientes" className="block text-center text-sm text-slate-500 hover:underline mt-6">
          Ver todos os clientes →
        </Link>
      )}
    </div>
  );
}

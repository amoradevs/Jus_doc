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
  const firstName = user.name?.split(' ')[0] ?? 'Advogada';

  return (
    <div>
      {/* Cabeçalho de boas-vindas */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Bem-vinda de volta,</p>
          <h1 className="text-2xl font-bold text-foreground">{firstName}</h1>
        </div>
        <Button asChild className="rounded-xl">
          <Link href="/clientes/novo">+ Novo cliente</Link>
        </Button>
      </div>

      {/* Seção de clientes recentes */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Clientes recentes
        </h2>
        {lista.length > 0 && (
          <Link href="/clientes" className="text-xs text-primary hover:underline font-medium">
            Ver todos →
          </Link>
        )}
      </div>

      {lista.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-16 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-4">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-primary"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <p className="text-muted-foreground text-sm mb-5">Nenhum cliente cadastrado ainda.</p>
          <Button asChild variant="outline" size="sm" className="rounded-lg">
            <Link href="/clientes/novo">Cadastrar primeiro cliente</Link>
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          {lista.map((c: { id: string; nome_completo: string; cpf: string }, i: number) => (
            <div
              key={c.id}
              className={`flex items-center justify-between px-5 py-4 hover:bg-secondary/40 transition-colors${i !== 0 ? ' border-t border-border' : ''}`}
            >
              <div>
                <p className="font-medium text-sm text-foreground">{c.nome_completo}</p>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">{maskCPF(c.cpf)}</p>
              </div>
              <Button asChild size="sm" variant="outline" className="rounded-lg text-xs h-7 border-border">
                <Link href={`/clientes/${c.id}`}>Abrir</Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

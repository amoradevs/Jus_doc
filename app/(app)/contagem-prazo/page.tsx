import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { PlanejamentoWrapper } from '@/components/contagem-prazo/planejamento-wrapper';

export default async function PlanejamentoPage() {
  const user = await getCurrentUser();

  const { data: clientes } = await db
    .from('clients')
    .select('id, nome_completo, cpf, data_nascimento, genero')
    .eq('tenant_id', user.tenantId)
    .order('nome_completo', { ascending: true });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Planejamento Previdenciário</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Calcule a melhor data de aposentadoria pelas regras de transição da EC 103/2019.
        </p>
      </div>

      <PlanejamentoWrapper clientes={clientes ?? []} />
    </div>
  );
}

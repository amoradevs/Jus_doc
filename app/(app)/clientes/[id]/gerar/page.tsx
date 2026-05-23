import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { notFound, redirect } from 'next/navigation';
import { GerarModo } from '@/components/cenario-wizard/gerar-modo';
import { labelTipoBeneficio } from '@/lib/processo';
import Link from 'next/link';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ processoId?: string }>;
};

export default async function GerarPage({ params, searchParams }: Props) {
  const user = await getCurrentUser();
  const { id } = await params;
  const { processoId: processoIdParam } = await searchParams;

  const { data: clientRows } = await db
    .from('clients')
    .select('id, nome_completo')
    .eq('id', id)
    .eq('tenant_id', user.tenantId)
    .is('deletado_em', null)
    .limit(1);

  const client = clientRows?.[0];
  if (!client) notFound();

  const { data: settingsRows } = await db
    .from('office_settings')
    .select('advogada_principal_nome')
    .eq('tenant_id', user.tenantId)
    .limit(1);

  if (!settingsRows?.[0]?.advogada_principal_nome) {
    redirect('/configuracoes?aviso=preencha-antes-de-gerar');
  }

  const { data: processoRows } = await db
    .from('processos')
    .select('id, numero_interno, tipo_beneficio')
    .eq('cliente_id', id)
    .order('created_at', { ascending: false });

  const processos = processoRows ?? [];

  // Resolve qual processoId usar
  let processoId: string | undefined;
  if (processoIdParam && processos.some((p) => p.id === processoIdParam)) {
    processoId = processoIdParam;
  } else if (processos.length === 1) {
    processoId = processos[0].id;
  }
  // Se múltiplos e nenhum selecionado → mostra seletor abaixo

  const mostrarSeletor = processos.length > 1 && !processoId;

  return (
    <div>
      <Link
        href={`/clientes/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {client.nome_completo}
      </Link>

      <h1 className="text-2xl font-bold text-foreground mb-1">Gerar documentos</h1>

      {mostrarSeletor ? (
        <>
          <p className="text-muted-foreground text-sm mb-6">
            Esta cliente tem mais de um processo. Selecione para qual deseja gerar os documentos.
          </p>
          <div className="space-y-2 max-w-xl">
            {processos.map((p) => (
              <Link
                key={p.id}
                href={`/clientes/${id}/gerar?processoId=${p.id}`}
                className="block bg-card rounded-2xl border border-border p-4 hover:border-primary/40 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-mono font-semibold text-primary mb-0.5">{p.numero_interno}</p>
                    <p className="text-sm font-medium text-foreground">{labelTipoBeneficio(p.tipo_beneficio)}</p>
                  </div>
                  <svg
                    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    className="text-muted-foreground/30 shrink-0 group-hover:text-primary/50 transition-colors"
                  >
                    <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </>
      ) : (
        <>
          {processoId && processos.length > 1 && (
            <div className="flex items-center gap-2 mb-4">
              <p className="text-sm text-muted-foreground">
                Processo:{' '}
                <span className="font-medium text-foreground">
                  {labelTipoBeneficio(processos.find((p) => p.id === processoId)?.tipo_beneficio ?? '')}
                </span>
              </p>
              <Link href={`/clientes/${id}/gerar`} className="text-xs text-primary hover:underline">
                Trocar
              </Link>
            </div>
          )}
          <GerarModo clientId={id} processoId={processoId} />
        </>
      )}
    </div>
  );
}

import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { maskCPF } from '@/lib/validators/cpf';
import { calcularIdade } from '@/lib/format/age';
import { labelTipoPedido } from '@/lib/processo';

export default async function ClientePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  const { id } = await params;

  const { data: clientRows } = await db
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', user.tenantId)
    .is('deletado_em', null)
    .limit(1);

  const client = clientRows?.[0];
  if (!client) notFound();

  const { data: packages } = await db
    .from('generation_packages')
    .select('*')
    .eq('client_id', id)
    .eq('tenant_id', user.tenantId)
    .order('criado_em', { ascending: false })
    .limit(10);

  const agora = new Date();
  const idade = calcularIdade(client.data_nascimento);

  return (
    <div>
      {/* Navegação */}
      <Link
        href="/clientes"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Clientes
      </Link>

      {/* Cabeçalho do cliente */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{client.nome_completo}</h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-sm text-muted-foreground font-mono">{maskCPF(client.cpf)}</span>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-sm text-muted-foreground">{idade} anos</span>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-sm text-muted-foreground">{client.estado_civil}</span>
            <span className="text-muted-foreground/40">·</span>
            <StatusBadge status={client.status_pedido} />
          </div>
        </div>
        <div className="flex gap-2 shrink-0 ml-4">
          <Button asChild variant="outline" size="sm" className="rounded-lg border-border">
            <Link href={`/clientes/${id}/editar`}>Editar</Link>
          </Button>
          <Button asChild size="sm" className="rounded-lg">
            <Link href={`/clientes/${id}/gerar`}>Gerar documentos</Link>
          </Button>
        </div>
      </div>

      {/* Card Processo */}
      <div className="bg-white rounded-2xl border border-border p-5 mb-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
          Processo
        </h2>
        <div className="flex flex-wrap gap-x-10 gap-y-3">
          <div className="flex gap-3 text-sm">
            <span className="text-muted-foreground text-xs pt-0.5 w-32 shrink-0">Tipo de benefício</span>
            <span className="text-foreground">{labelTipoPedido(client.tipo_pedido)}</span>
          </div>
          <div className="flex gap-3 text-sm">
            <span className="text-muted-foreground text-xs pt-0.5 w-32 shrink-0">Data de entrada</span>
            <span className="text-foreground">
              {client.data_entrada_pedido
                ? new Date(client.data_entrada_pedido + 'T12:00:00').toLocaleDateString('pt-BR')
                : <span className="text-muted-foreground">—</span>}
            </span>
          </div>
          <div className="flex gap-3 text-sm items-center">
            <span className="text-muted-foreground text-xs w-32 shrink-0">Situação</span>
            <StatusBadge status={client.status_pedido} />
          </div>
        </div>
      </div>

      {/* Dados em grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        <div className="bg-white rounded-2xl border border-border p-5">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
            Dados pessoais
          </h2>
          <div className="space-y-3">
            <Row label="RG" value={`${client.rg} ${client.rg_orgao_emissor}`} />
            <Row label="Nascimento" value={new Date(client.data_nascimento).toLocaleDateString('pt-BR')} />
            <Row label="Gênero" value={client.genero === 'F' ? 'Feminino' : 'Masculino'} />
            <Row label="Nacionalidade" value={client.nacionalidade} />
            <Row label="Nome da mãe" value={client.nome_mae} />
            {client.nome_pai && <Row label="Nome do pai" value={client.nome_pai} />}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border p-5">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
            Endereço
          </h2>
          <div className="space-y-3">
            <Row
              label="Logradouro"
              value={`${client.endereco_logradouro}, ${client.endereco_numero}${client.endereco_complemento ? ` — ${client.endereco_complemento}` : ''}`}
            />
            <Row label="Bairro" value={client.endereco_bairro} />
            <Row label="Cidade / UF" value={`${client.endereco_cidade} / ${client.endereco_uf}`} />
            <Row label="CEP" value={client.endereco_cep.replace(/(\d{5})(\d{3})/, '$1-$2')} />
          </div>
        </div>
      </div>

      {/* Histórico de pacotes */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
          Documentos gerados
        </h2>

        {!packages || packages.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border p-10 text-center">
            <p className="text-muted-foreground text-sm">Nenhum pacote gerado ainda.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            {packages.map((pkg: { id: string; criado_em: string; expira_em: string; templates_usados: string[] }, i: number) => {
              const expirado = new Date(pkg.expira_em) < agora;
              return (
                <div
                  key={pkg.id}
                  className={`flex items-center justify-between px-5 py-4 hover:bg-secondary/20 transition-colors${i !== 0 ? ' border-t border-border' : ''}`}
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {new Date(pkg.criado_em).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {pkg.templates_usados.length} documento(s)
                    </p>
                  </div>
                  {expirado ? (
                    <span className="text-xs text-muted-foreground border border-border rounded-lg px-2.5 py-1">
                      Expirado
                    </span>
                  ) : (
                    <Button asChild size="sm" variant="outline" className="rounded-lg border-border text-xs h-7">
                      <Link href={`/api/download/${pkg.id}`}>Baixar ZIP</Link>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

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
    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted border border-border rounded-full px-2 py-0.5">
      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
      Em andamento
    </span>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 text-sm">
      <span className="text-muted-foreground w-28 shrink-0 text-xs pt-0.5">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

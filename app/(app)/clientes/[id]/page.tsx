import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { maskCPF } from '@/lib/validators/cpf';
import { calcularIdade } from '@/lib/format/age';
import { labelTipoPedido } from '@/lib/processo';
import { DocumentChecklist } from '@/components/document-checklist';
import { InitChecklistButton } from '@/components/init-checklist-button';

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

  const [{ data: packages }, { data: caseDocs }] = await Promise.all([
    db
      .from('generation_packages')
      .select('*')
      .eq('client_id', id)
      .eq('tenant_id', user.tenantId)
      .order('criado_em', { ascending: false })
      .limit(10),
    db
      .from('case_documents')
      .select('*')
      .eq('client_id', id)
      .eq('tenant_id', user.tenantId)
      .order('criado_em', { ascending: true }),
  ]);

  const agora = new Date();
  const idade = calcularIdade(client.data_nascimento);
  const documents = (caseDocs ?? []) as {
    id: string;
    nome: string;
    categoria: string;
    obrigatorio: boolean;
    recebido: boolean;
    recebido_em: string | null;
    observacao: string | null;
  }[];

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
      <div className="flex flex-wrap items-start justify-between gap-3 mb-8">
        <div className="min-w-0">
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
        <div className="flex gap-2 shrink-0">
          {client.telefone && (
            <a
              href={`https://wa.me/55${client.telefone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              title={`Chamar ${client.nome_completo.split(' ')[0]} no WhatsApp`}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#25D366] hover:bg-[#1ebe5d] text-white text-xs font-medium transition-colors shadow-sm"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          )}
          <Button asChild variant="outline" size="sm" className="rounded-lg border-border">
            <Link href={`/clientes/${id}/editar`}>Editar</Link>
          </Button>
          <Button asChild size="sm" className="rounded-lg">
            <Link href={`/clientes/${id}/gerar`}>
              <span className="sm:hidden">Gerar</span>
              <span className="hidden sm:inline">Gerar documentos</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Card Processo */}
      <div className="bg-card rounded-2xl border border-border p-5 mb-4">
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

      {/* Checklist de documentos */}
      <div className="mb-4">
        {documents.length > 0 ? (
          <DocumentChecklist
            clientId={id}
            documents={documents}
            nomeCliente={client.nome_completo}
            telefone={client.telefone ?? null}
          />
        ) : (
          <div className="bg-card rounded-2xl border border-border p-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">Nenhum checklist de documentos iniciado.</p>
            <InitChecklistButton clientId={id} tipoPedido={client.tipo_pedido} />
          </div>
        )}
      </div>

      {/* Dados em grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        <div className="bg-card rounded-2xl border border-border p-5">
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
            {client.telefone && (
              <div className="flex gap-3 text-sm">
                <span className="text-muted-foreground w-28 shrink-0 text-xs pt-0.5">Telefone</span>
                <a
                  href={`https://wa.me/55${client.telefone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 transition-colors flex items-center gap-1.5"
                >
                  {client.telefone}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="opacity-60">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5">
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
          <div className="bg-card rounded-2xl border border-border p-10 text-center">
            <p className="text-muted-foreground text-sm">Nenhum pacote gerado ainda.</p>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
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
                      <Link href={`/api/download/${pkg.id}`}>Baixar</Link>
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

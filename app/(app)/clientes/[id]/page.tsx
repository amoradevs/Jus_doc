import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { maskCPF } from '@/lib/validators/cpf';
import { calcularIdade } from '@/lib/format/age';

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
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{client.nome_completo}</h1>
          <p className="text-slate-500 text-sm mt-1">
            CPF: {maskCPF(client.cpf)} · {idade} anos · {client.estado_civil}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link href={`/clientes/${id}/editar`}>Editar</Link></Button>
          <Button asChild><Link href={`/clientes/${id}/gerar`}>Gerar documentos</Link></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
        <div className="bg-white rounded-lg border p-4 space-y-2">
          <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide mb-3">Dados pessoais</h2>
          <Row label="RG" value={`${client.rg} ${client.rg_orgao_emissor}`} />
          <Row label="Nascimento" value={new Date(client.data_nascimento).toLocaleDateString('pt-BR')} />
          <Row label="Gênero" value={client.genero === 'F' ? 'Feminino' : 'Masculino'} />
          <Row label="Nacionalidade" value={client.nacionalidade} />
          <Row label="Nome da mãe" value={client.nome_mae} />
          {client.nome_pai && <Row label="Nome do pai" value={client.nome_pai} />}
        </div>
        <div className="bg-white rounded-lg border p-4 space-y-2">
          <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide mb-3">Endereço</h2>
          <Row label="Logradouro" value={`${client.endereco_logradouro}, ${client.endereco_numero}${client.endereco_complemento ? ` - ${client.endereco_complemento}` : ''}`} />
          <Row label="Bairro" value={client.endereco_bairro} />
          <Row label="Cidade/UF" value={`${client.endereco_cidade} / ${client.endereco_uf}`} />
          <Row label="CEP" value={client.endereco_cep.replace(/(\d{5})(\d{3})/, '$1-$2')} />
        </div>
      </div>

      <div>
        <h2 className="font-semibold text-slate-800 mb-4">Histórico de documentos gerados</h2>
        {!packages || packages.length === 0 ? (
          <p className="text-slate-500 text-sm">Nenhum pacote gerado ainda.</p>
        ) : (
          <div className="space-y-3">
            {packages.map((pkg: { id: string; criado_em: string; expira_em: string; templates_usados: string[] }) => {
              const expirado = new Date(pkg.expira_em) < agora;
              return (
                <div key={pkg.id} className="bg-white border rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {new Date(pkg.criado_em).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">{pkg.templates_usados.length} documento(s)</p>
                  </div>
                  {expirado ? (
                    <span className="text-xs text-slate-400 border rounded px-2 py-1">Expirado</span>
                  ) : (
                    <Button asChild size="sm" variant="outline">
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-slate-400 w-28 shrink-0">{label}</span>
      <span className="text-slate-700">{value}</span>
    </div>
  );
}

import { getCurrentUser } from '@/lib/auth-helpers';
import Link from 'next/link';
import { db } from '@/lib/db';
import { buildTemplateContext } from '@/lib/document-generation/template-context';
import { renderDocxTemplate } from '@/lib/document-generation/docx-renderer';
import { DocumentReviewer, type DocDraft } from '@/components/revisar/document-reviewer';
import mammoth from 'mammoth';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ codigos?: string }>;
};

export default async function RevisarPage({ params, searchParams }: Props) {
  const user = await getCurrentUser();
  const { id } = await params;
  const { codigos: codigosParam } = await searchParams;
  const codigos = codigosParam?.split(',').filter(Boolean) ?? [];

  const { data: templates } = await db
    .from('document_templates')
    .select('*')
    .in('codigo', codigos)
    .eq('ativo', 'true');

  const context = await buildTemplateContext(id, user.tenantId);

  const docs: DocDraft[] = await Promise.all(
    codigos.map(async (codigo) => {
      const template = templates?.find((t) => t.codigo === codigo);
      if (!template) return { codigo, nome: codigo, html: '', editavel: false };

      if (template.formato !== 'docx') {
        return { codigo, nome: template.nome, html: '', editavel: false };
      }

      try {
        const docxBuffer = await renderDocxTemplate(template.caminho_arquivo, context);
        const { value: html } = await mammoth.convertToHtml({ buffer: Buffer.from(docxBuffer) });
        return { codigo, nome: template.nome, html, editavel: true };
      } catch {
        return { codigo, nome: template.nome, html: '', editavel: false };
      }
    }),
  );

  const clientName = context.cliente.nome_completo ?? 'Cliente';

  return (
    <div className="max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-1 flex-wrap text-sm">
        <Link href="/clientes" className="text-muted-foreground hover:text-foreground transition-colors">
          Clientes
        </Link>
        <span className="text-muted-foreground/50">/</span>
        <Link href={`/clientes/${id}`} className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[160px]">
          {clientName}
        </Link>
        <span className="text-muted-foreground/50">/</span>
        <Link href={`/clientes/${id}/gerar`} className="text-muted-foreground hover:text-foreground transition-colors">
          Gerar
        </Link>
        <span className="text-muted-foreground/50">/</span>
        <span className="text-foreground">Revisar</span>
      </div>

      <div className="mb-6 mt-4">
        <h1 className="text-2xl font-bold text-foreground">Revisar documentos</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Edite o conteúdo antes de gerar os PDFs finais. Clique em um documento para expandir.
        </p>
      </div>

      <DocumentReviewer clientId={id} docs={docs} />
    </div>
  );
}

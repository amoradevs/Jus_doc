import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { TemplateManager } from '@/components/template-manager';
import Link from 'next/link';

export default async function TemplatesPage() {
  await getCurrentUser();

  const { data: templates } = await db
    .from('document_templates')
    .select('id, codigo, nome, familia, formato, ativo, editado_em, editado_por, storage_path')
    .order('codigo');

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-2 mb-1">
        <Link
          href="/configuracoes"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Configurações
        </Link>
        <span className="text-muted-foreground/50 text-sm">/</span>
        <span className="text-sm text-foreground">Templates</span>
      </div>

      <div className="flex items-center justify-between mb-6 mt-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Templates de documentos</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Gerencie os modelos usados na geração de documentos.
          </p>
        </div>
      </div>

      <TemplateManager templates={templates ?? []} />
    </div>
  );
}

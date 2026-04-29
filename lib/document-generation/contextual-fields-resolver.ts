import { db } from '@/lib/db';
import { document_templates } from '@/lib/db/schema';
import { inArray } from 'drizzle-orm';

export type ContextualGroup = 'representante_legal' | 'conjuge' | 'filho_dependente' | 'empresa_mei' | 'imovel' | 'testemunhas';

export async function getRequiredContextualGroups(templateCodes: string[]): Promise<ContextualGroup[]> {
  const templates = await db
    .select({ campos: document_templates.campos_contextuais_necessarios })
    .from(document_templates)
    .where(inArray(document_templates.codigo, templateCodes));

  const all = templates.flatMap((t) => (t.campos as ContextualGroup[]) ?? []);
  return [...new Set(all)];
}

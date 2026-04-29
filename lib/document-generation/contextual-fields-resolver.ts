import { db } from '@/lib/db';

export type ContextualGroup = 'representante_legal' | 'conjuge' | 'filho_dependente' | 'empresa_mei' | 'imovel' | 'testemunhas';

export async function getRequiredContextualGroups(templateCodes: string[]): Promise<ContextualGroup[]> {
  const { data: templates } = await db
    .from('document_templates')
    .select('campos_contextuais_necessarios')
    .in('codigo', templateCodes);

  const all = (templates ?? []).flatMap((t: { campos_contextuais_necessarios: ContextualGroup[] }) =>
    (t.campos_contextuais_necessarios as ContextualGroup[]) ?? []
  );
  return [...new Set(all)];
}

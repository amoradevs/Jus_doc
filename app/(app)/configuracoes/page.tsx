import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { office_settings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { OfficeSettingsForm } from '@/components/office-settings-form';

export default async function ConfiguracoesPage() {
  const user = await getCurrentUser();
  const [settings] = await db
    .select()
    .from(office_settings)
    .where(eq(office_settings.tenant_id, user.tenantId))
    .limit(1);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Configurações do escritório</h1>
      <OfficeSettingsForm defaultValues={settings ? { ...settings, endereco_complemento: settings.endereco_complemento ?? undefined } : undefined} />
    </div>
  );
}

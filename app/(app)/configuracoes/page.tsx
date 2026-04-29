import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { OfficeSettingsForm } from '@/components/office-settings-form';

export default async function ConfiguracoesPage() {
  const user = await getCurrentUser();
  const { data: rows } = await db
    .from('office_settings')
    .select('*')
    .eq('tenant_id', user.tenantId)
    .limit(1);

  const settings = rows?.[0] ?? undefined;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Configurações do escritório</h1>
      <OfficeSettingsForm defaultValues={settings ? { ...settings, endereco_complemento: settings.endereco_complemento ?? undefined } : undefined} />
    </div>
  );
}

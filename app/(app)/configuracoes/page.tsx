import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { OfficeSettingsForm } from '@/components/office-settings-form';
import Link from 'next/link';

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
      <h1 className="text-2xl font-bold text-foreground mb-6">Configurações do escritório</h1>

      {/* Atalho para templates */}
      <Link
        href="/configuracoes/templates"
        className="flex items-center justify-between w-full mb-8 px-4 py-3.5 bg-secondary/60 hover:bg-secondary rounded-xl border border-border transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Templates de documentos</p>
            <p className="text-xs text-muted-foreground">Gerencie e faça upload dos modelos</p>
          </div>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground group-hover:text-foreground transition-colors">
          <path d="M9 18l6-6-6-6" strokeLinecap="round"/>
        </svg>
      </Link>

      <OfficeSettingsForm defaultValues={settings ? { ...settings, endereco_complemento: settings.endereco_complemento ?? undefined } : undefined} />
    </div>
  );
}

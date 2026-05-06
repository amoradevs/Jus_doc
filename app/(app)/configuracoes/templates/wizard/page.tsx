import { getCurrentUser } from '@/lib/auth-helpers';
import Link from 'next/link';
import { WizardFlow } from '@/components/template-wizard/wizard-flow';

export default async function TemplateWizardPage() {
  await getCurrentUser();

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 mb-1">
        <Link href="/configuracoes" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Configurações
        </Link>
        <span className="text-muted-foreground/50 text-sm">/</span>
        <Link href="/configuracoes/templates" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Templates
        </Link>
        <span className="text-muted-foreground/50 text-sm">/</span>
        <span className="text-sm text-foreground">Wizard</span>
      </div>

      <div className="mb-6 mt-4">
        <h1 className="text-2xl font-bold text-foreground">Template Wizard</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Suba um DOCX original e a IA identifica automaticamente onde inserir as tags.
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <WizardFlow />
      </div>
    </div>
  );
}

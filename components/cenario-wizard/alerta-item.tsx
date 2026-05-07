import { AlertTriangle, Info, XCircle } from 'lucide-react';
import type { Alerta } from '@/lib/document-generation/cadeia-documental';

const CONFIG = {
  erro: {
    wrapper: 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300',
    icon: XCircle,
  },
  aviso: {
    wrapper: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
    icon: AlertTriangle,
  },
  info: {
    wrapper: 'border-border bg-secondary text-muted-foreground',
    icon: Info,
  },
};

export function AlertaItem({ alerta }: { alerta: Alerta }) {
  const { wrapper, icon: Icon } = CONFIG[alerta.nivel];
  return (
    <div className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm ${wrapper}`}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <span>{alerta.mensagem}</span>
    </div>
  );
}

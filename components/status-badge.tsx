import { labelStatusResultado } from '@/lib/processo';

const STATUS_STYLE: Record<string, { color: string; dot: string }> = {
  deferido:               { color: 'text-emerald-700 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
  indeferido:             { color: 'text-destructive bg-destructive/5 border-destructive/20', dot: 'bg-destructive' },
  exigencia:              { color: 'text-amber-700 bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
  recurso_administrativo: { color: 'text-violet-700 bg-violet-50 border-violet-200', dot: 'bg-violet-500' },
  judicializado:          { color: 'text-rose-700 bg-rose-50 border-rose-200', dot: 'bg-rose-500' },
  arquivado:              { color: 'text-gray-600 bg-gray-50 border-gray-200', dot: 'bg-gray-400' },
  em_andamento:           { color: 'text-primary bg-primary/5 border-primary/20', dot: 'bg-primary/60' },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.em_andamento;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium border rounded-full px-2.5 py-0.5 ${s.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
      {labelStatusResultado(status)}
    </span>
  );
}

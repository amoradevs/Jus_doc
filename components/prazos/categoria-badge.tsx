import { CATEGORIA_STYLE, labelCategoria, type CategoriaPrazo } from '@/lib/prazos/categorias';

export function CategoriaBadge({ categoria }: { categoria: string }) {
  const style = CATEGORIA_STYLE[categoria as CategoriaPrazo] ?? CATEGORIA_STYLE['comercial_interno'];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5 ${style.badgeBg} ${style.badgeText}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
      {labelCategoria(categoria)}
    </span>
  );
}

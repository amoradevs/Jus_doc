'use client';

import { useRouter } from 'next/navigation';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const SELECT_CLASS =
  'h-8 rounded-lg border border-input bg-card px-2.5 text-xs text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 cursor-pointer';

export function FiltroPeriodo({
  mesAtivo,
  anoAtivo,
  anoAtual,
  isPadrao = false,
}: {
  mesAtivo: number | null;
  anoAtivo: number | null;
  anoAtual: number;
  isPadrao?: boolean;
}) {
  const router = useRouter();

  const anos: number[] = [];
  for (let a = 2020; a <= anoAtual; a++) anos.push(a);

  function navigate(mes: number | null, ano: number | null) {
    const p = new URLSearchParams();
    if (mes) p.set('mes', mes.toString());
    if (ano) p.set('ano', ano.toString());
    router.push(p.toString() ? `/?${p.toString()}` : '/');
  }

  return (
    <div className="flex items-center gap-2">
      <select
        className={SELECT_CLASS}
        value={mesAtivo ?? ''}
        onChange={(e) => navigate(e.target.value ? parseInt(e.target.value) : null, anoAtivo)}
      >
        <option value="">Todos os meses</option>
        {MESES.map((m, i) => (
          <option key={i} value={i + 1}>{m}</option>
        ))}
      </select>

      <select
        className={SELECT_CLASS}
        value={anoAtivo ?? ''}
        onChange={(e) => navigate(mesAtivo, e.target.value ? parseInt(e.target.value) : null)}
      >
        <option value="">Todos os anos</option>
        {anos.map((a) => (
          <option key={a} value={a}>{a}</option>
        ))}
      </select>

      {!isPadrao && (
        <button
          onClick={() => navigate(null, null)}
          className="h-8 px-2.5 rounded-lg text-xs text-muted-foreground border border-input bg-card hover:bg-secondary transition-colors"
        >
          Limpar
        </button>
      )}
    </div>
  );
}

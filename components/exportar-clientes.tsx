'use client';

import { useState, useRef, useEffect } from 'react';

type Periodo = 'todos' | '7d' | '30d' | '90d' | 'periodo';

const OPCOES: { value: Periodo; label: string; descricao?: string }[] = [
  { value: 'todos',   label: 'Todos os clientes' },
  { value: '7d',      label: 'Últimos 7 dias' },
  { value: '30d',     label: 'Últimos 30 dias' },
  { value: '90d',     label: 'Últimos 90 dias' },
  { value: 'periodo', label: 'Por mês / ano' },
];

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function ExportarClientes() {
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState<Periodo>('todos');
  const [mes, setMes] = useState('');
  const [ano, setAno] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const anoAtual = new Date().getFullYear();
  const anos: number[] = [];
  for (let a = 2020; a <= anoAtual; a++) anos.push(a);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function buildUrl() {
    const params = new URLSearchParams();
    if (tipo === '7d' || tipo === '30d' || tipo === '90d') {
      params.set('periodo', tipo);
    } else if (tipo === 'periodo') {
      if (mes) params.set('mes', mes);
      if (ano) params.set('ano', ano);
    }
    const qs = params.toString();
    return `/api/clientes/exportar${qs ? '?' + qs : ''}`;
  }

  function handleDownload() {
    window.location.href = buildUrl();
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      {/* Botão ícone */}
      <button
        onClick={() => setOpen((o) => !o)}
        title="Exportar clientes para planilha"
        className={`h-9 w-9 flex items-center justify-center rounded-xl border transition-colors ${
          open
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-border bg-card text-muted-foreground hover:text-foreground hover:bg-secondary'
        }`}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-11 w-64 bg-card border border-border rounded-2xl shadow-xl shadow-black/10 z-50 overflow-hidden">

          {/* Cabeçalho */}
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs font-semibold text-foreground">Exportar clientes</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Planilha .csv — abre no Excel e Google Sheets</p>
          </div>

          {/* Opções de período */}
          <div className="p-2 space-y-0.5">
            {OPCOES.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTipo(opt.value)}
                className={`w-full text-left text-xs px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  tipo === opt.value
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-foreground hover:bg-secondary'
                }`}
              >
                <span className={`w-3 h-3 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                  tipo === opt.value ? 'border-primary' : 'border-border'
                }`}>
                  {tipo === opt.value && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary block" />
                  )}
                </span>
                {opt.label}
              </button>
            ))}
          </div>

          {/* Seletores mês/ano */}
          {tipo === 'periodo' && (
            <div className="px-3 pb-3 flex gap-2">
              <select
                value={mes}
                onChange={(e) => setMes(e.target.value)}
                className="flex-1 h-8 rounded-lg border border-input bg-transparent px-2 text-xs text-foreground outline-none focus:border-primary/50"
              >
                <option value="">Todos os meses</option>
                {MESES.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
              <select
                value={ano}
                onChange={(e) => setAno(e.target.value)}
                className="w-[72px] h-8 rounded-lg border border-input bg-transparent px-2 text-xs text-foreground outline-none focus:border-primary/50"
              >
                <option value="">Ano</option>
                {anos.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          )}

          {/* Botão baixar */}
          <div className="px-3 pb-3 pt-1 border-t border-border">
            <button
              onClick={handleDownload}
              className="w-full h-8 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Baixar planilha
            </button>
          </div>

        </div>
      )}
    </div>
  );
}

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'andamento', label: 'Em andamento' },
  { value: 'deferido', label: 'Deferido' },
  { value: 'indeferido', label: 'Indeferido' },
];

const SORT_OPTIONS = [
  { value: '', label: 'Mais recentes' },
  { value: 'nome', label: 'Nome A→Z' },
  { value: 'antigos', label: 'Mais antigos' },
];

export function ClientFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const status = searchParams.get('status') ?? '';
  const cidade = searchParams.get('cidade') ?? '';
  const sort = searchParams.get('sort') ?? '';
  const searchParam = searchParams.get('search') ?? '';

  const [searchValue, setSearchValue] = useState(searchParam);

  // Sync input when URL changes externally (e.g. back button)
  useEffect(() => {
    setSearchValue(searchParam);
  }, [searchParam]);

  const push = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value) params.set(key, value);
        else params.delete(key);
      });
      params.delete('page');
      router.push(`/clientes?${params.toString()}`);
    },
    [router, searchParams],
  );

  function handleSearchChange(value: string) {
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      push({ search: value });
    }, 400);
  }

  return (
    <div className="space-y-3 mb-5">
      {/* Campo de busca por nome/CPF */}
      <input
        type="text"
        value={searchValue}
        onChange={(e) => handleSearchChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            push({ search: searchValue });
          }
        }}
        placeholder="Buscar por nome ou CPF…"
        className="w-full sm:w-80 bg-white border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-colors"
      />

      {/* Filtros e ordenação */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Pills de status */}
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_OPTIONS.map(({ value, label }) => {
            const active = status === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => push({ status: value })}
                className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                  active
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="flex-1" />

        {/* Filtro por cidade */}
        <input
          type="text"
          placeholder="Cidade…"
          defaultValue={cidade}
          onBlur={(e) => push({ cidade: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') push({ cidade: (e.target as HTMLInputElement).value });
          }}
          className="w-36 bg-white border border-border rounded-lg px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors"
        />

        {/* Ordenação */}
        <select
          value={sort}
          onChange={(e) => push({ sort: e.target.value })}
          className="bg-white border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors"
        >
          {SORT_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

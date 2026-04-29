'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

type Props = { initials: string; children: React.ReactNode };

export function UserMenu({ initials, children }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        title="Conta"
        className={`h-8 w-8 rounded-full border flex items-center justify-center transition-all duration-150 ${
          open
            ? 'bg-primary/15 border-primary/50 ring-2 ring-primary/20'
            : 'bg-primary/10 border-primary/20 hover:bg-primary/15 hover:border-primary/40 hover:ring-2 hover:ring-primary/15'
        }`}
      >
        <span className="text-[10px] font-bold text-primary tracking-wide leading-none">{initials}</span>
      </button>

      <div
        className={`absolute right-0 top-full mt-2 w-44 bg-white rounded-xl border border-border shadow-lg shadow-black/5 py-1.5 z-50 transition-all duration-150 origin-top-right ${
          open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <Link
          href="/configuracoes"
          onClick={() => setOpen(false)}
          className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
          Configurações
        </Link>
        <div className="mx-3 my-1 border-t border-border/50" />
        {children}
      </div>
    </div>
  );
}

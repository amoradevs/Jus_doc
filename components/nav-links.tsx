'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/clientes', label: 'Clientes', short: 'Clientes' },
  { href: '/pipeline', label: 'Pipeline', short: 'Pipeline' },
  { href: '/contagem-prazo', label: 'Contagem de Prazo', short: 'Prazos' },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-0.5">
      {links.map(({ href, label, short }) => {
        const active = pathname === href || pathname.startsWith(href + '/');
        return (
          <Link
            key={href}
            href={href}
            className={`relative px-2.5 sm:px-3.5 py-2 text-xs sm:text-sm rounded-lg transition-colors duration-150 ${
              active
                ? 'text-primary font-medium'
                : 'text-muted-foreground font-normal hover:text-foreground hover:bg-secondary/50'
            }`}
          >
            <span className="sm:hidden">{short}</span>
            <span className="hidden sm:inline">{label}</span>
            {active && (
              <span className="absolute bottom-1 left-2.5 right-2.5 sm:left-3.5 sm:right-3.5 h-px bg-primary/60 rounded-full" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

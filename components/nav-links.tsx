'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/clientes', label: 'Clientes' },
  { href: '/contagem-prazo', label: 'Contagem de Prazo' },
  { href: '/configuracoes', label: 'Configurações' },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-0.5">
      {links.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(href + '/');
        return (
          <Link
            key={href}
            href={href}
            className={`relative px-3.5 py-2 text-sm rounded-lg transition-colors duration-150 ${
              active
                ? 'text-primary font-medium'
                : 'text-muted-foreground font-normal hover:text-foreground hover:bg-secondary/50'
            }`}
          >
            {label}
            {active && (
              <span className="absolute bottom-1 left-3.5 right-3.5 h-px bg-primary/60 rounded-full" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

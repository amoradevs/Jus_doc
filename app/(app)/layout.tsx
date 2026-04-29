import { getCurrentUser } from '@/lib/auth-helpers';
import { signOut } from '@/lib/auth';
import Link from 'next/link';
import Image from 'next/image';
import { Toaster } from '@/components/ui/sonner';
import { NavLinks } from '@/components/nav-links';
import { LidiAgent } from '@/components/lidi-agent';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const nameParts = user.name?.split(' ') ?? [];
  const firstName = nameParts[0] ?? 'Usuária';
  const initials = nameParts
    .filter(Boolean)
    .map((n) => n[0].toUpperCase())
    .slice(0, 2)
    .join('');

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="bg-white/96 backdrop-blur-md border-b border-border/50 sticky top-0 z-40 shadow-[0_1px_12px_rgba(43,29,42,0.06)]">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center gap-6">
          {/* Logo */}
          <Link href="/" className="shrink-0 flex items-center">
            <Image
              src="/Claro.png"
              alt="Lidiane Abreu Advogada"
              width={500}
              height={500}
              className="h-[46px] w-auto"
              priority
            />
          </Link>

          {/* Separador */}
          <div className="w-px h-5 bg-border/70 shrink-0" />

          {/* Nav links */}
          <NavLinks />

          {/* Espaçador */}
          <div className="flex-1" />

          {/* Usuária */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-7 w-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-primary tracking-wide leading-none">{initials}</span>
            </div>
            <span className="text-sm text-muted-foreground hidden sm:block">{firstName}</span>
            <span className="text-border">·</span>
            <form action={async () => { 'use server'; await signOut({ redirectTo: '/login' }); }}>
              <button
                type="submit"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        {children}
      </main>

      <LidiAgent />
      <Toaster richColors position="top-right" />
    </div>
  );
}

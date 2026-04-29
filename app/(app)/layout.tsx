import { getCurrentUser } from '@/lib/auth-helpers';
import Link from 'next/link';
import Image from 'next/image';
import { Toaster } from '@/components/ui/sonner';
import { NavLinks } from '@/components/nav-links';
import { BecaAgent } from '@/components/beca-agent';
import { UserMenu } from '@/components/user-menu';
import { SignOutForm } from '@/components/sign-out-form';
import { ThemeToggle } from '@/components/theme-toggle';
import { FontSizeControl } from '@/components/font-size-control';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const nameParts = user.name?.split(' ').filter(Boolean) ?? [];
  const initials = nameParts.map((n) => n[0].toUpperCase()).slice(0, 2).join('');

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="bg-white/96 dark:bg-card/95 backdrop-blur-md border-b border-border/50 sticky top-0 z-40 shadow-[0_1px_12px_rgba(43,29,42,0.07)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-[84px] sm:h-[124px] flex items-center gap-3 sm:gap-5">

          {/* Logo — light / dark */}
          <Link href="/" className="shrink-0 flex items-center">
            <Image
              src="/Claro.png"
              alt="Lidiane Abreu Advogada"
              width={500}
              height={500}
              className="h-[68px] sm:h-[110px] w-auto dark:hidden"
              priority
            />
            <Image
              src="/Escuro.png"
              alt="Lidiane Abreu Advogada"
              width={500}
              height={500}
              className="h-[68px] sm:h-[110px] w-auto hidden dark:block"
              priority
            />
          </Link>

          {/* Separador — oculto em mobile */}
          <div className="hidden sm:block w-px h-6 bg-border/60 shrink-0" />

          {/* Nav links */}
          <NavLinks />

          {/* Espaçador */}
          <div className="flex-1" />

          {/* Controles — font size oculto em mobile */}
          <div className="flex items-center gap-1">
            <div className="hidden sm:flex">
              <FontSizeControl />
            </div>
            <ThemeToggle />
          </div>

          <div className="hidden sm:block w-px h-5 bg-border/60 shrink-0" />

          {/* Usuário */}
          <UserMenu initials={initials}>
            <SignOutForm />
          </UserMenu>

        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>

      <BecaAgent />
      <Toaster richColors position="top-right" />
    </div>
  );
}

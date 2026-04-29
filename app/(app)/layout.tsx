import { getCurrentUser } from '@/lib/auth-helpers';
import { signOut } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const firstName = user.name?.split(' ')[0] ?? 'Usuária';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="bg-white border-b border-border sticky top-0 z-50 shadow-[0_1px_3px_rgba(166,102,138,0.06)]">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2.5" y="1.5" width="11" height="13" rx="1.5" stroke="white" strokeWidth="1.2"/>
                <path d="M5 6h6M5 8.5h6M5 11h4" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="font-bold text-foreground text-[15px] tracking-tight">JusDoc</span>
          </Link>

          <nav className="flex items-center gap-1 text-sm">
            <Link
              href="/clientes"
              className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors font-medium"
            >
              Clientes
            </Link>
            <Link
              href="/configuracoes"
              className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors font-medium"
            >
              Configurações
            </Link>
            <div className="w-px h-4 bg-border mx-2" />
            <span className="text-muted-foreground text-xs">{firstName}</span>
            <form action={async () => { 'use server'; await signOut({ redirectTo: '/login' }); }}>
              <Button variant="ghost" size="sm" type="submit" className="text-muted-foreground hover:text-foreground text-xs h-7 ml-1">
                Sair
              </Button>
            </form>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        {children}
      </main>

      <Toaster richColors position="top-right" />
    </div>
  );
}

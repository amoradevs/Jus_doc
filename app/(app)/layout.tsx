import { getCurrentUser } from '@/lib/auth-helpers';
import { signOut } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="border-b bg-white px-6 py-3 flex items-center justify-between">
        <Link href="/" className="font-semibold text-slate-800">JusDoc</Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/configuracoes" className="text-slate-600 hover:text-slate-900">Configurações</Link>
          <span className="text-slate-400">|</span>
          <span className="text-slate-600">{user.name}</span>
          <form action={async () => { 'use server'; await signOut({ redirectTo: '/login' }); }}>
            <Button variant="ghost" size="sm" type="submit">Sair</Button>
          </form>
        </nav>
      </header>
      <main className="flex-1 px-6 py-8 max-w-5xl mx-auto w-full">
        {children}
      </main>
      <Toaster richColors position="top-right" />
    </div>
  );
}

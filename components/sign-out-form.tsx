import { signOut } from '@/lib/auth';

export function SignOutForm() {
  return (
    <form
      action={async () => {
        'use server';
        await signOut({ redirectTo: '/login' });
      }}
    >
      <button
        type="submit"
        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors text-left"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
        </svg>
        Sair
      </button>
    </form>
  );
}

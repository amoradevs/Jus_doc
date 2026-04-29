import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      async authorize(credentials) {
        console.log('[auth] authorize called, credentials keys:', Object.keys(credentials ?? {}));

        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        console.log('[auth] email defined:', !!email, 'password defined:', !!password);

        if (!email || !password) return null;

        console.log('[auth] env:', !!process.env.SUPABASE_URL, !!process.env.SUPABASE_SERVICE_KEY);

        const supabase = createClient(
          process.env.SUPABASE_URL ?? '',
          process.env.SUPABASE_SERVICE_KEY ?? ''
        );

        const { data: rows, error } = await supabase
          .from('users')
          .select('id, email, nome, tenant_id, senha_hash')
          .eq('email', email)
          .limit(1);

        console.log('[auth] rows:', rows?.length ?? 0, 'error:', error?.message ?? 'none');

        if (error || !rows || rows.length === 0) return null;
        const user = rows[0];

        const ok = await bcrypt.compare(password, String(user.senha_hash));
        console.log('[auth] bcrypt ok:', ok);
        if (!ok) return null;

        return { id: user.id, email: user.email, name: user.nome, tenantId: user.tenant_id };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.tenantId = (user as { tenantId: string }).tenantId;
      return token;
    },
    session({ session, token }) {
      session.user.id = token.sub!;
      (session as { tenantId?: string }).tenantId = token.tenantId as string;
      return session;
    },
  },
});

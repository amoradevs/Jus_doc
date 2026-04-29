import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_KEY!
        );

        const { data: rows, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', parsed.data.email)
          .limit(1);

        if (error || !rows || rows.length === 0) return null;
        const user = rows[0];

        const ok = await bcrypt.compare(parsed.data.password, user.senha_hash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.nome,
          tenantId: user.tenant_id,
        };
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

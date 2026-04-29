import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db),
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, parsed.data.email))
          .limit(1);

        if (!user) return null;

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

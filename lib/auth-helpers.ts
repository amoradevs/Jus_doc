import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  return {
    id: session.user.id,
    email: session.user.email!,
    name: session.user.name!,
    tenantId: (session as { tenantId?: string }).tenantId!,
  };
}

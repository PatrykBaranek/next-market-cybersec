import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ReactNode } from 'react';

// SECURITY (typical): defense-in-depth — even though middleware checks /admin auth,
// the layout enforces role check at render time.
// baseline diff: this role check is removed. With middleware also missing, /admin is fully exposed.
// hardened diff: identical to typical (middleware adds role-check redundancy too).
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'admin') redirect('/');

  return (
    <div className="grid grid-cols-[200px_1fr] gap-6">
      <aside className="border-r pr-4 text-sm">
        <h2 className="font-semibold mb-3">Admin</h2>
        <ul className="space-y-2">
          <li><Link href="/admin">Dashboard</Link></li>
          <li><Link href="/admin/users">Użytkownicy</Link></li>
          <li><Link href="/admin/listings">Ogłoszenia</Link></li>
        </ul>
      </aside>
      <section>{children}</section>
    </div>
  );
}

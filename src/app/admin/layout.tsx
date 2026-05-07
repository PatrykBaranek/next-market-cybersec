import Link from 'next/link';
import { ReactNode } from 'react';

// SECURITY (baseline): no auth, no role check.
// Combined with deleted middleware, /admin/* is fully accessible to anyone.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-[200px_1fr] gap-8">
      <aside className="border-r border-gray-200 pr-6 text-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Admin</h2>
        <ul className="space-y-1">
          <li>
            <Link href="/admin" className="block rounded-md px-2 py-1.5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition">
              Dashboard
            </Link>
          </li>
          <li>
            <Link href="/admin/users" className="block rounded-md px-2 py-1.5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition">
              Użytkownicy
            </Link>
          </li>
          <li>
            <Link href="/admin/listings" className="block rounded-md px-2 py-1.5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition">
              Ogłoszenia
            </Link>
          </li>
        </ul>
      </aside>
      <section>{children}</section>
    </div>
  );
}

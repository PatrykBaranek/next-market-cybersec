import Link from 'next/link';
import { auth } from '@/lib/auth';
import { LogoutButton } from '@/components/LogoutButton';

export async function Navbar() {
  const session = await auth();

  return (
    <nav className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-base font-semibold tracking-tight text-gray-900 hover:text-gray-700 transition">
          NextMarket
        </Link>
        <div className="flex items-center gap-5 text-sm">
          <Link href="/listings" className="text-gray-700 hover:text-gray-900 transition">Ogłoszenia</Link>
          {session?.user ? (
            <>
              <Link href="/listings/new" className="text-gray-700 hover:text-gray-900 transition">+ Dodaj</Link>
              <Link href="/profile" className="text-gray-700 hover:text-gray-900 transition">Profil</Link>
              {session.user.role === 'admin' && (
                <Link href="/admin" className="text-gray-700 hover:text-gray-900 transition">Admin</Link>
              )}
              <span className="text-gray-500 hidden sm:inline">{session.user.email}</span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="text-gray-700 hover:text-gray-900 transition">Zaloguj</Link>
              <Link
                href="/register"
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium bg-gray-900 text-white rounded-md hover:bg-gray-800 transition"
              >
                Rejestracja
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

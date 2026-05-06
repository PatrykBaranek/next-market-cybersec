import Link from 'next/link';
import { auth, signOut } from '@/lib/auth';

export async function Navbar() {
  const session = await auth();

  return (
    <nav className="border-b bg-white">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg">NextMarket</Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/listings">Ogłoszenia</Link>
          {session?.user ? (
            <>
              <Link href="/listings/new">+ Dodaj</Link>
              <Link href="/profile">Profil</Link>
              {session.user.role === 'admin' && <Link href="/admin">Admin</Link>}
              <span className="text-gray-600">{session.user.email}</span>
              <form action={async () => { 'use server'; await signOut({ redirectTo: '/' }); }}>
                <button type="submit" className="underline">Wyloguj</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login">Zaloguj</Link>
              <Link href="/register">Rejestracja</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

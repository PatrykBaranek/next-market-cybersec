'use client';
import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }
  return (
    <button type="button" onClick={logout} className="text-gray-700 hover:text-gray-900 transition">
      Wyloguj
    </button>
  );
}

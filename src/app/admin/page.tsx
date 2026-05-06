import { db } from '@/lib/db';
import { users, listings, messages } from '@/lib/db/schema';
import { count } from 'drizzle-orm';

export default async function AdminDashboard() {
  const [[u], [l], [m]] = await Promise.all([
    db.select({ n: count() }).from(users),
    db.select({ n: count() }).from(listings),
    db.select({ n: count() }).from(messages),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 border rounded"><p className="text-sm text-gray-600">Użytkownicy</p><p className="text-3xl font-bold">{u.n}</p></div>
        <div className="p-4 border rounded"><p className="text-sm text-gray-600">Ogłoszenia</p><p className="text-3xl font-bold">{l.n}</p></div>
        <div className="p-4 border rounded"><p className="text-sm text-gray-600">Wiadomości</p><p className="text-3xl font-bold">{m.n}</p></div>
      </div>
    </div>
  );
}

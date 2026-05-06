import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { banUser, unbanUser } from '@/lib/actions/admin';

export default async function AdminUsersPage() {
  const all = await db.select().from(users).orderBy(desc(users.createdAt));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Użytkownicy</h1>
      <table className="w-full text-sm">
        <thead className="text-left border-b">
          <tr><th className="p-2">Email</th><th>Imię</th><th>Rola</th><th>Status</th><th>Akcja</th></tr>
        </thead>
        <tbody>
          {all.map((u) => (
            <tr key={u.id} className="border-b">
              <td className="p-2">{u.email}</td>
              <td>{u.name}</td>
              <td>{u.role}</td>
              <td>{u.banned ? '🚫 Zbanowany' : '✓ Aktywny'}</td>
              <td>
                <form action={u.banned
                  ? async () => { 'use server'; await unbanUser(u.id); }
                  : async () => { 'use server'; await banUser(u.id); }
                }>
                  <button type="submit" className="underline">{u.banned ? 'Odbanuj' : 'Zbanuj'}</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { db } from '@/lib/db';
import { listings } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { approveListing, rejectListing, adminDeleteListing } from '@/lib/actions/admin';

export default async function AdminListingsPage() {
  const all = await db.select().from(listings).orderBy(desc(listings.createdAt));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Moderacja ogłoszeń</h1>
      <table className="w-full text-sm">
        <thead className="text-left border-b">
          <tr><th className="p-2">Tytuł</th><th>Status</th><th>Akcje</th></tr>
        </thead>
        <tbody>
          {all.map((l) => (
            <tr key={l.id} className="border-b">
              <td className="p-2">{l.title}</td>
              <td>{l.status}</td>
              <td className="space-x-3">
                <form className="inline" action={async () => { 'use server'; await approveListing(l.id); }}><button className="underline">Zatwierdź</button></form>
                <form className="inline" action={async () => { 'use server'; await rejectListing(l.id); }}><button className="underline">Odrzuć</button></form>
                <form className="inline" action={async () => { 'use server'; await adminDeleteListing(l.id); }}><button className="underline text-red-600">Usuń</button></form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

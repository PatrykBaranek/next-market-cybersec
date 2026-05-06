import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { listings } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { ListingCard } from '@/components/ListingCard';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const myListings = await db
    .select()
    .from(listings)
    .where(eq(listings.authorId, session.user.id))
    .orderBy(desc(listings.createdAt));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Profil</h1>
      <p className="text-sm text-gray-600 mb-6">
        {session.user.name} — {session.user.email} ({session.user.role})
      </p>

      <h2 className="text-xl font-semibold mb-3">Moje ogłoszenia ({myListings.length})</h2>
      {myListings.length === 0 ? (
        <p className="text-gray-600">Nie masz jeszcze ogłoszeń.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {myListings.map((l) => <ListingCard key={l.id} listing={l} />)}
        </div>
      )}
    </div>
  );
}

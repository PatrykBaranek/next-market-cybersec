import { Suspense } from 'react';
import { db } from '@/lib/db';
import { listings } from '@/lib/db/schema';
import { eq, like, and, desc } from 'drizzle-orm';
import { ListingCard } from '@/components/ListingCard';
import { SearchBar } from '@/components/SearchBar';

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  // SECURITY (typical): Drizzle parameterized queries (LIKE with `${q}` is bound, not interpolated).
  // baseline diff: replaced with `db.execute(sql.raw(`...WHERE title LIKE '%${q}%'`))` (SQL injection).
  // hardened diff: + Zod validation on `q` (max length 100, trim).
  const rows = await db
    .select()
    .from(listings)
    .where(
      and(
        eq(listings.status, 'active'),
        q ? like(listings.title, `%${q}%`) : undefined,
      ),
    )
    .orderBy(desc(listings.createdAt))
    .limit(50);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Ogłoszenia</h1>
      <Suspense><SearchBar /></Suspense>
      {rows.length === 0 ? (
        <p className="text-gray-600">Brak ogłoszeń{q ? ` dla "${q}"` : ''}.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}

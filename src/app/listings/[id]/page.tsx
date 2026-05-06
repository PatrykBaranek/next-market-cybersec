import { db } from '@/lib/db';
import { listings, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { RichTextDisplay } from '@/components/RichTextDisplay';
import { ContactForm } from '@/components/ContactForm';
import { auth } from '@/lib/auth';
import Link from 'next/link';

// SECURITY (typical): ISR with default revalidation. No on-demand revalidation endpoint.
// hardened diff: + /api/revalidate route protected by REVALIDATION_SECRET token (T9).
export const revalidate = 60;

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [row] = await db
    .select({
      listing: listings,
      author: users,
    })
    .from(listings)
    .innerJoin(users, eq(listings.authorId, users.id))
    .where(eq(listings.id, id))
    .limit(1);

  if (!row) notFound();

  const session = await auth();
  const isOwner = session?.user?.id === row.author.id;

  return (
    <article className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">{row.listing.title}</h1>
      <p className="text-2xl font-bold mb-4">{row.listing.price} {row.listing.currency}</p>

      {row.listing.imageUrl && (
        <div className="relative w-full aspect-[3/2] mb-4">
          <Image src={row.listing.imageUrl} alt={row.listing.title} fill className="object-cover rounded" />
        </div>
      )}

      <RichTextDisplay content={row.listing.description} />

      <div className="mt-6 p-4 bg-gray-50 rounded">
        <p className="text-sm text-gray-600">Sprzedawca: <strong>{row.author.name}</strong></p>
        {isOwner && (
          <Link href={`/listings/${row.listing.id}/edit`} className="underline text-sm">
            Edytuj ogłoszenie
          </Link>
        )}
      </div>

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Skontaktuj się ze sprzedawcą</h2>
        <ContactForm listingId={row.listing.id} recipientId={row.author.id} />
      </section>
    </article>
  );
}

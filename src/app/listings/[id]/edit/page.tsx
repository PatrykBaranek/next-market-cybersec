import { db } from '@/lib/db';
import { listings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import { ListingForm } from '@/components/ListingForm';
import { deleteListing } from '@/lib/actions/listings';

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const [listing] = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
  if (!listing) notFound();

  // SECURITY (typical): server-side authorization check before rendering edit form.
  // baseline diff: this block is removed.
  if (listing.authorId !== session.user.id && session.user.role !== 'admin') {
    redirect('/listings');
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Edytuj ogłoszenie</h1>
      <ListingForm
        mode="edit"
        listingId={listing.id}
        initial={{
          title: listing.title,
          description: listing.description,
          price: listing.price,
          currency: listing.currency,
          imageUrl: listing.imageUrl,
        }}
      />
      <form action={async () => { 'use server'; await deleteListing(listing.id); }} className="mt-6">
        <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded">Usuń ogłoszenie</button>
      </form>
    </div>
  );
}

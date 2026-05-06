import Link from 'next/link';
import Image from 'next/image';
import type { Listing } from '@/lib/db/schema';

export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link href={`/listings/${listing.id}`} className="block border rounded overflow-hidden hover:shadow">
      {listing.imageUrl && (
        <div className="relative w-full aspect-[3/2] bg-gray-100">
          <Image
            src={listing.imageUrl}
            alt={listing.title}
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover"
          />
        </div>
      )}
      <div className="p-3">
        <h3 className="font-semibold truncate">{listing.title}</h3>
        <p className="text-lg font-bold">{listing.price} {listing.currency}</p>
      </div>
    </Link>
  );
}

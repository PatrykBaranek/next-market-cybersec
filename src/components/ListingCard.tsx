import Link from 'next/link';
import Image from 'next/image';
import type { Listing } from '@/lib/db/schema';

export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group block overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xs transition hover:border-gray-900 hover:shadow-md hover:-translate-y-0.5"
    >
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
      <div className="p-4">
        <h3 className="font-medium text-gray-900 truncate group-hover:underline underline-offset-2 decoration-1">
          {listing.title}
        </h3>
        <p className="mt-1 text-base font-semibold text-gray-900 tabular-nums">
          {listing.price} <span className="text-gray-500 font-normal">{listing.currency}</span>
        </p>
      </div>
    </Link>
  );
}

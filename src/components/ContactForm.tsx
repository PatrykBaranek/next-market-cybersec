'use client';

export function ContactForm({ listingId, recipientId }: { listingId: string; recipientId: string }) {
  return (
    <p className="text-sm text-gray-500">
      Formularz kontaktowy w przygotowaniu ({listingId.slice(0, 8)}…, {recipientId.slice(0, 8)}…)
    </p>
  );
}

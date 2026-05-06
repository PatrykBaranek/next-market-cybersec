'use client';

import { useState } from 'react';
import { createListing, updateListing } from '@/lib/actions/listings';

type Props =
  | { mode: 'create'; initial?: never; listingId?: never }
  | { mode: 'edit'; listingId: string; initial: { title: string; description: string; price: string; currency: string; imageUrl: string | null } };

export function ListingForm(props: Props) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = props.mode === 'create'
      ? await createListing(formData)
      : await updateListing(props.listingId, formData);
    setLoading(false);
    if (result?.error) setError(result.error);
  }

  return (
    <form action={handleSubmit} className="space-y-4 max-w-2xl">
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div>
        <label className="block text-sm font-medium" htmlFor="title">Tytuł</label>
        <input id="title" name="title" type="text" required maxLength={200} defaultValue={props.initial?.title} className="w-full p-2 border rounded" />
      </div>
      <div>
        <label className="block text-sm font-medium" htmlFor="description">Opis (HTML dozwolony)</label>
        <textarea id="description" name="description" required rows={8} defaultValue={props.initial?.description} className="w-full p-2 border rounded font-mono text-sm" />
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-sm font-medium" htmlFor="price">Cena</label>
          <input id="price" name="price" type="text" required defaultValue={props.initial?.price} className="w-full p-2 border rounded" />
        </div>
        <div className="w-24">
          <label className="block text-sm font-medium" htmlFor="currency">Waluta</label>
          <select id="currency" name="currency" defaultValue={props.initial?.currency ?? 'PLN'} className="w-full p-2 border rounded">
            <option value="PLN">PLN</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium" htmlFor="imageUrl">URL obrazka (opcjonalny)</label>
        <input id="imageUrl" name="imageUrl" type="url" defaultValue={props.initial?.imageUrl ?? ''} className="w-full p-2 border rounded" placeholder="https://picsum.photos/600/400" />
      </div>
      <button type="submit" disabled={loading} className="px-4 py-2 bg-black text-white rounded disabled:opacity-50">
        {loading ? 'Zapisywanie…' : (props.mode === 'create' ? 'Dodaj ogłoszenie' : 'Zapisz zmiany')}
      </button>
    </form>
  );
}

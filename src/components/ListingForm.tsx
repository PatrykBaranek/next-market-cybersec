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

  const inputClass =
    'w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition';

  return (
    <form action={handleSubmit} className="space-y-5 max-w-2xl">
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="title">Tytuł</label>
        <input id="title" name="title" type="text" required maxLength={200} defaultValue={props.initial?.title} className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="description">Opis (HTML dozwolony)</label>
        <textarea
          id="description"
          name="description"
          required
          rows={8}
          defaultValue={props.initial?.description}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-white font-mono placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition"
        />
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="price">Cena</label>
          <input id="price" name="price" type="text" required defaultValue={props.initial?.price} className={inputClass} />
        </div>
        <div className="w-28">
          <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="currency">Waluta</label>
          <select id="currency" name="currency" defaultValue={props.initial?.currency ?? 'PLN'} className={inputClass}>
            <option value="PLN">PLN</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="imageUrl">URL obrazka (opcjonalny)</label>
        <input id="imageUrl" name="imageUrl" type="url" defaultValue={props.initial?.imageUrl ?? ''} className={inputClass} placeholder="https://picsum.photos/600/400" />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 transition"
      >
        {loading ? 'Zapisywanie…' : (props.mode === 'create' ? 'Dodaj ogłoszenie' : 'Zapisz zmiany')}
      </button>
    </form>
  );
}

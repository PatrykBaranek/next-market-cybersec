'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export function SearchBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const url = q ? `/listings?q=${encodeURIComponent(q)}` : '/listings';
    router.push(url);
  }

  return (
    <form onSubmit={submit} className="flex gap-2 mb-6">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Szukaj ogłoszeń…"
        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition"
      />
      <button
        type="submit"
        className="inline-flex items-center px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-md hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 transition"
      >
        Szukaj
      </button>
    </form>
  );
}

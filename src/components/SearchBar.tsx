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
    <form onSubmit={submit} className="flex gap-2 mb-4">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Szukaj ogłoszeń…"
        className="flex-1 p-2 border rounded"
      />
      <button type="submit" className="px-4 py-2 bg-black text-white rounded">Szukaj</button>
    </form>
  );
}

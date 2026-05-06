'use client';

import { useState } from 'react';
import { registerUser } from '@/lib/actions/auth';

export function RegisterForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await registerUser(formData);
    setLoading(false);
    if (result?.error) setError(result.error);
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <h1 className="text-2xl font-bold">Rejestracja</h1>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div>
        <label className="block text-sm font-medium" htmlFor="name">Imię i nazwisko</label>
        <input id="name" name="name" type="text" required className="w-full p-2 border rounded" />
      </div>
      <div>
        <label className="block text-sm font-medium" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required className="w-full p-2 border rounded" />
      </div>
      <div>
        <label className="block text-sm font-medium" htmlFor="password">Hasło (min 8 znaków)</label>
        <input id="password" name="password" type="password" required minLength={8} className="w-full p-2 border rounded" />
      </div>
      <button type="submit" disabled={loading} className="w-full p-2 bg-black text-white rounded disabled:opacity-50">
        {loading ? 'Rejestracja…' : 'Zarejestruj się'}
      </button>
      <p className="text-sm text-center">
        Masz konto? <a href="/login" className="underline">Zaloguj się</a>
      </p>
    </form>
  );
}

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
    <form action={handleSubmit} className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Rejestracja</h1>
        <p className="mt-1 text-sm text-gray-500">Załóż konto, aby dodawać ogłoszenia.</p>
      </div>
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="name">Imię i nazwisko</label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="password">Hasło (min 8 znaków)</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 transition"
      >
        {loading ? 'Rejestracja…' : 'Zarejestruj się'}
      </button>
      <p className="text-sm text-center text-gray-500">
        Masz konto? <a href="/login" className="font-medium text-gray-900 hover:underline underline-offset-2">Zaloguj się</a>
      </p>
    </form>
  );
}

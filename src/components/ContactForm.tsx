'use client';

import { useState } from 'react';
import { sendContactMessage } from '@/lib/actions/contact';

export function ContactForm({ listingId, recipientId }: { listingId: string; recipientId: string }) {
  const [status, setStatus] = useState<{ kind: 'idle' } | { kind: 'sending' } | { kind: 'ok' } | { kind: 'error'; msg: string }>({ kind: 'idle' });

  async function action(formData: FormData) {
    setStatus({ kind: 'sending' });
    const result = await sendContactMessage({ listingId, recipientId, formData });
    if (result.ok) setStatus({ kind: 'ok' });
    else setStatus({ kind: 'error', msg: result.error ?? 'Błąd' });
  }

  if (status.kind === 'ok') {
    return (
      <p className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
        ✓ Wiadomość wysłana
      </p>
    );
  }

  const inputClass =
    'w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition';

  return (
    <form action={action} className="space-y-3">
      <input name="senderName" type="text" placeholder="Imię" required className={inputClass} />
      <input name="senderEmail" type="email" placeholder="Email" required className={inputClass} />
      <textarea name="content" placeholder="Wiadomość" required rows={4} className={inputClass} />
      {status.kind === 'error' && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{status.msg}</p>
      )}
      <button
        type="submit"
        disabled={status.kind === 'sending'}
        className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 transition"
      >
        {status.kind === 'sending' ? 'Wysyłanie…' : 'Wyślij wiadomość'}
      </button>
    </form>
  );
}

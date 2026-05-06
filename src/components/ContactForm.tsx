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
    return <p className="p-3 bg-green-50 rounded">✓ Wiadomość wysłana</p>;
  }

  return (
    <form action={action} className="space-y-3">
      <input name="senderName" type="text" placeholder="Imię" required className="w-full p-2 border rounded" />
      <input name="senderEmail" type="email" placeholder="Email" required className="w-full p-2 border rounded" />
      <textarea name="content" placeholder="Wiadomość" required rows={4} className="w-full p-2 border rounded" />
      {status.kind === 'error' && <p className="text-red-600 text-sm">{status.msg}</p>}
      <button type="submit" disabled={status.kind === 'sending'} className="px-4 py-2 bg-black text-white rounded disabled:opacity-50">
        {status.kind === 'sending' ? 'Wysyłanie…' : 'Wyślij wiadomość'}
      </button>
    </form>
  );
}

'use server';

import { db } from '@/lib/db';
import { messages } from '@/lib/db/schema';

// SECURITY (typical): Server Action — Next.js built-in CSRF protection (T4 mitigated by framework).
// No Zod (just type coercion), no rate limiting, no honeypot.
// baseline diff: this file deleted; logic moved to /api/contact/route.ts as plain Route Handler (T3 vulnerable).
// hardened diff: + Zod, + rate limit per IP, + honeypot field check.

export async function sendContactMessage(input: {
  listingId: string;
  recipientId: string;
  formData: FormData;
}): Promise<{ ok: boolean; error?: string }> {
  const senderName = String(input.formData.get('senderName') ?? '').trim();
  const senderEmail = String(input.formData.get('senderEmail') ?? '').trim();
  const content = String(input.formData.get('content') ?? '').trim();

  if (!senderName || !senderEmail || !content) {
    return { ok: false, error: 'Wypełnij wszystkie pola' };
  }

  await db.insert(messages).values({
    listingId: input.listingId,
    recipientId: input.recipientId,
    senderEmail,
    senderName,
    content,
  });

  return { ok: true };
}

'use server';

import { db } from '@/lib/db';
import { messages } from '@/lib/db/schema';
import { z } from 'zod';
import { headers } from 'next/headers';
import { checkRateLimit, rateLimitKey } from '@/lib/utils/rate-limit';

// SECURITY (hardened): Zod, rate limit per IP, honeypot field.

const contactSchema = z.object({
  senderName: z.string().min(2).max(100).trim(),
  senderEmail: z.string().email().max(255),
  content: z.string().min(5).max(5_000).trim(),
  // honeypot — must be empty.
  website: z.string().max(0).optional().default(''),
});

export async function sendContactMessage(input: {
  listingId: string;
  recipientId: string;
  formData: FormData;
}): Promise<{ ok: boolean; error?: string }> {
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';

  const rl = checkRateLimit(rateLimitKey(ip, 'contact'), 3, 60_000);
  if (!rl.ok) {
    return { ok: false, error: 'Zbyt wiele wiadomości. Spróbuj ponownie za chwilę.' };
  }

  const parsed = contactSchema.safeParse({
    senderName: input.formData.get('senderName'),
    senderEmail: input.formData.get('senderEmail'),
    content: input.formData.get('content'),
    website: input.formData.get('website') ?? '',
  });

  if (!parsed.success) {
    return { ok: false, error: 'Nieprawidłowe dane' };
  }

  await db.insert(messages).values({
    listingId: input.listingId,
    recipientId: input.recipientId,
    senderEmail: parsed.data.senderEmail,
    senderName: parsed.data.senderName,
    content: parsed.data.content,
  });

  return { ok: true };
}

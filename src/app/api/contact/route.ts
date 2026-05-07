import { db } from '@/lib/db';
import { messages } from '@/lib/db/schema';

// SECURITY (baseline): plain POST handler — NO CSRF protection (T3 vulnerable).
// Cross-origin form submission would succeed (Next.js does NOT add CSRF to Route Handlers).

export async function POST(req: Request) {
  const body = await req.json();

  await db.insert(messages).values({
    listingId: String(body.listingId),
    recipientId: String(body.recipientId),
    senderName: String(body.senderName),
    senderEmail: String(body.senderEmail),
    content: String(body.content),
  });

  return Response.json({ ok: true });
}

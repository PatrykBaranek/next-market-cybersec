import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { listings } from '@/lib/db/schema';
import { eq, like, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { sanitizeHtml } from '@/lib/utils/sanitize';

// SECURITY (hardened): Origin validation, Zod, paginate ≤ 50.

const searchSchema = z.object({
  q: z.string().max(100).optional().default(''),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

const createSchema = z.object({
  title: z.string().min(3).max(200).trim(),
  description: z.string().min(10).max(10_000),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/),
  currency: z.enum(['PLN', 'EUR', 'USD']).default('PLN'),
  imageUrl: z.string().url().optional(),
});

function checkOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true; // Same-origin GET (no Origin header).
  const allowed = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  return origin === allowed;
}

export async function GET(req: Request) {
  if (!checkOrigin(req)) return new Response('Forbidden', { status: 403 });

  const { searchParams } = new URL(req.url);
  const parsed = searchSchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const { q, page, limit } = parsed.data;

  const results = await db.select().from(listings)
    .where(and(eq(listings.status, 'active'), q ? like(listings.title, `%${q}%`) : undefined))
    .orderBy(desc(listings.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  return Response.json(results);
}

export async function POST(req: Request) {
  if (!checkOrigin(req)) return new Response('Forbidden', { status: 403 });

  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const [created] = await db.insert(listings).values({
    title: parsed.data.title,
    description: sanitizeHtml(parsed.data.description),
    price: parsed.data.price,
    currency: parsed.data.currency,
    imageUrl: parsed.data.imageUrl ?? null,
    status: 'active',
    authorId: session.user.id,
  }).returning();

  return Response.json(created, { status: 201 });
}

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { listings } from '@/lib/db/schema';
import { eq, like, and, desc } from 'drizzle-orm';

// SECURITY (typical): Drizzle parameterized queries (no SQLi). Auth required for POST.
// No origin validation (CSRF possible from same-origin scripts but not classic cross-site).
// baseline diff: GET uses sql.raw with string interpolation (SQLi). POST has no auth.
// hardened diff: + Origin header validation, Zod on query params, paginate with limit ≤ 50.

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';

  const results = await db
    .select()
    .from(listings)
    .where(and(
      eq(listings.status, 'active'),
      q ? like(listings.title, `%${q}%`) : undefined,
    ))
    .orderBy(desc(listings.createdAt))
    .limit(50);

  return Response.json(results);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();

  const [created] = await db.insert(listings).values({
    title: String(body.title ?? ''),
    description: String(body.description ?? ''),
    price: String(body.price ?? '0'),
    currency: String(body.currency ?? 'PLN'),
    imageUrl: body.imageUrl ?? null,
    status: 'active',
    authorId: session.user.id,
  }).returning();

  return Response.json(created, { status: 201 });
}

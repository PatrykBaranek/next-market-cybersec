import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { listings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// SECURITY (typical): auth + ownership check on PUT/DELETE; GET is public.
// baseline diff: removes auth and ownership checks (IDOR + CSRF).
// hardened diff: + Origin validation, stricter Zod, normalized error messages.

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [row] = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
  if (!row) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json(row);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const [existing] = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
  if (!existing) return Response.json({ error: 'Not found' }, { status: 404 });
  if (existing.authorId !== session.user.id && session.user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const [updated] = await db.update(listings)
    .set({
      title: body.title ?? existing.title,
      description: body.description ?? existing.description,
      price: body.price ?? existing.price,
      updatedAt: new Date(),
    })
    .where(eq(listings.id, id))
    .returning();

  return Response.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const [existing] = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
  if (!existing) return Response.json({ error: 'Not found' }, { status: 404 });
  if (existing.authorId !== session.user.id && session.user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  await db.delete(listings).where(eq(listings.id, id));
  return new Response(null, { status: 204 });
}

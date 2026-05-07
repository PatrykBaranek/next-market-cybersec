import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { listings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { sanitizeHtml } from '@/lib/utils/sanitize';

const updateSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).max(10_000).optional(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
});

function checkOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true;
  const allowed = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  return origin === allowed;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [row] = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
  if (!row) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json(row);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!checkOrigin(req)) return new Response('Forbidden', { status: 403 });

  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const [existing] = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
  if (!existing) return Response.json({ error: 'Not found' }, { status: 404 });
  if (existing.authorId !== session.user.id && session.user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const [updated] = await db.update(listings).set({
    ...(parsed.data.title && { title: parsed.data.title }),
    ...(parsed.data.description && { description: sanitizeHtml(parsed.data.description) }),
    ...(parsed.data.price && { price: parsed.data.price }),
    updatedAt: new Date(),
  }).where(eq(listings.id, id)).returning();

  return Response.json(updated);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!checkOrigin(req)) return new Response('Forbidden', { status: 403 });

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

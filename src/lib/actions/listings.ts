'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { listings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

// SECURITY (typical): session check only, no Zod validation, no description sanitization,
// ownership check exists for update/delete but not for ALL operations.
// baseline diff: removes session check (anyone can create), no ownership check on update/delete.
// hardened diff: + Zod schema, sanitizeHtml(description), strict ownership check, audit logs.

export async function createListing(formData: FormData): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '');
  const price = String(formData.get('price') ?? '');
  const currency = String(formData.get('currency') ?? 'PLN');
  const imageUrl = String(formData.get('imageUrl') ?? '') || null;

  if (!title || !description || !price) {
    return { error: 'Brakujące pola' };
  }

  const [created] = await db.insert(listings).values({
    title,
    description, // SECURITY (typical): no sanitization here.
    price,
    currency,
    imageUrl,
    status: 'active',
    authorId: session.user.id,
  }).returning();

  revalidatePath('/listings');
  redirect(`/listings/${created.id}`);
}

export async function updateListing(id: string, formData: FormData): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const [existing] = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
  if (!existing) return { error: 'Ogłoszenie nie istnieje' };

  // SECURITY (typical): ownership check.
  // baseline diff: this block is removed (IDOR — anyone can edit anyone's listing).
  if (existing.authorId !== session.user.id && session.user.role !== 'admin') {
    return { error: 'Brak uprawnień' };
  }

  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '');
  const price = String(formData.get('price') ?? '');

  await db.update(listings)
    .set({ title, description, price, updatedAt: new Date() })
    .where(eq(listings.id, id));

  revalidatePath('/listings');
  revalidatePath(`/listings/${id}`);
  redirect(`/listings/${id}`);
}

export async function deleteListing(id: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const [existing] = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
  if (!existing) return { error: 'Ogłoszenie nie istnieje' };

  if (existing.authorId !== session.user.id && session.user.role !== 'admin') {
    return { error: 'Brak uprawnień' };
  }

  await db.delete(listings).where(eq(listings.id, id));
  revalidatePath('/listings');
  redirect('/listings');
}

'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { listings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { sanitizeHtml } from '@/lib/utils/sanitize';

// SECURITY (hardened): Zod input validation + sanitize description + strict ownership.

const createSchema = z.object({
  title: z.string().min(3).max(200).trim(),
  description: z.string().min(10).max(10_000),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/),
  currency: z.enum(['PLN', 'EUR', 'USD']),
  imageUrl: z.string().url().optional().or(z.literal('')),
});

const updateSchema = createSchema.partial();

export async function createListing(formData: FormData): Promise<{ error?: string | Record<string, string[] | undefined> }> {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const parsed = createSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    price: formData.get('price'),
    currency: formData.get('currency'),
    imageUrl: formData.get('imageUrl'),
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const [created] = await db.insert(listings).values({
    title: parsed.data.title,
    description: sanitizeHtml(parsed.data.description),
    price: parsed.data.price,
    currency: parsed.data.currency,
    imageUrl: parsed.data.imageUrl || null,
    status: 'active',
    authorId: session.user.id,
  }).returning();

  revalidatePath('/listings');
  redirect(`/listings/${created.id}`);
}

export async function updateListing(id: string, formData: FormData): Promise<{ error?: string | Record<string, string[] | undefined> }> {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const [existing] = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
  if (!existing) return { error: 'Ogłoszenie nie istnieje' };

  if (existing.authorId !== session.user.id && session.user.role !== 'admin') {
    return { error: 'Brak uprawnień' };
  }

  const parsed = updateSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    price: formData.get('price'),
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  await db.update(listings).set({
    ...(parsed.data.title !== undefined && { title: parsed.data.title }),
    ...(parsed.data.description !== undefined && { description: sanitizeHtml(parsed.data.description) }),
    ...(parsed.data.price !== undefined && { price: parsed.data.price }),
    updatedAt: new Date(),
  }).where(eq(listings.id, id));

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

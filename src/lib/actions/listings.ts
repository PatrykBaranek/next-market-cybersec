'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { listings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

// SECURITY (baseline): no ownership check, no validation.
// Anyone authenticated can update/delete ANY listing (T7 — IDOR).
// Description is stored as-is (T1 — Stored XSS sink).

export async function createListing(formData: FormData): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const [created] = await db.insert(listings).values({
    title: String(formData.get('title') ?? ''),
    description: String(formData.get('description') ?? ''),
    price: String(formData.get('price') ?? '0'),
    currency: String(formData.get('currency') ?? 'PLN'),
    imageUrl: String(formData.get('imageUrl') ?? '') || null,
    status: 'active',
    authorId: session.user.id,
  }).returning();

  revalidatePath('/listings');
  redirect(`/listings/${created.id}`);
}

export async function updateListing(id: string, formData: FormData): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  // SECURITY (baseline): NO ownership check. T7 vulnerable.
  await db.update(listings)
    .set({
      title: String(formData.get('title') ?? ''),
      description: String(formData.get('description') ?? ''),
      price: String(formData.get('price') ?? ''),
      updatedAt: new Date(),
    })
    .where(eq(listings.id, id));

  revalidatePath('/listings');
  revalidatePath(`/listings/${id}`);
  redirect(`/listings/${id}`);
}

export async function deleteListing(id: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  // SECURITY (baseline): NO ownership check.
  await db.delete(listings).where(eq(listings.id, id));
  revalidatePath('/listings');
  redirect('/listings');
}

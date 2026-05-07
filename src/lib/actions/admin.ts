'use server';

import { db } from '@/lib/db';
import { users, listings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// SECURITY (baseline): no role check. ANY caller (even unauthenticated, since
// middleware is gone) can ban users / approve listings via these Server Actions.
// T8 — privilege escalation: a regular user can hit the admin pages directly
// and POST these actions. Spec §7 row 6.

export async function banUser(userId: string) {
  await db.update(users).set({ banned: true }).where(eq(users.id, userId));
  revalidatePath('/admin/users');
}

export async function unbanUser(userId: string) {
  await db.update(users).set({ banned: false }).where(eq(users.id, userId));
  revalidatePath('/admin/users');
}

export async function approveListing(listingId: string) {
  await db.update(listings).set({ status: 'active' }).where(eq(listings.id, listingId));
  revalidatePath('/admin/listings');
}

export async function rejectListing(listingId: string) {
  await db.update(listings).set({ status: 'rejected' }).where(eq(listings.id, listingId));
  revalidatePath('/admin/listings');
}

export async function adminDeleteListing(listingId: string) {
  await db.delete(listings).where(eq(listings.id, listingId));
  revalidatePath('/admin/listings');
  revalidatePath('/listings');
}

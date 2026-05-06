'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, listings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// SECURITY (typical): role check inside each action.
// baseline diff: role check removed (any authenticated user can ban/approve).
// hardened diff: + rate limit, + audit log to console.

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    throw new Error('Forbidden');
  }
  return session;
}

export async function banUser(userId: string) {
  await requireAdmin();
  await db.update(users).set({ banned: true }).where(eq(users.id, userId));
  revalidatePath('/admin/users');
}

export async function unbanUser(userId: string) {
  await requireAdmin();
  await db.update(users).set({ banned: false }).where(eq(users.id, userId));
  revalidatePath('/admin/users');
}

export async function approveListing(listingId: string) {
  await requireAdmin();
  await db.update(listings).set({ status: 'active' }).where(eq(listings.id, listingId));
  revalidatePath('/admin/listings');
}

export async function rejectListing(listingId: string) {
  await requireAdmin();
  await db.update(listings).set({ status: 'rejected' }).where(eq(listings.id, listingId));
  revalidatePath('/admin/listings');
}

export async function adminDeleteListing(listingId: string) {
  await requireAdmin();
  await db.delete(listings).where(eq(listings.id, listingId));
  revalidatePath('/admin/listings');
  revalidatePath('/listings');
}

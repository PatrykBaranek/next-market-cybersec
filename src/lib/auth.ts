import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// SECURITY (baseline): homemade session in a plain cookie. The cookie value is
// just the user id — no signing, no expiry, no rotation. Combined with the
// flags set in /api/login (none of HttpOnly/Secure/SameSite), this makes T11
// (session theft via XSS) trivial: `document.cookie` exfiltrates the session.
//
// API surface intentionally matches the typical Auth.js export so callers
// (`Navbar`, server actions, pages) don't need to change their imports.

export const SESSION_COOKIE = 'nm_session';

export type Session = {
  user: { id: string; email: string; name: string; role: 'user' | 'admin' };
} | null;

export async function auth(): Promise<Session> {
  const store = await cookies();
  const userId = store.get(SESSION_COOKIE)?.value;
  if (!userId) return null;

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return null;
  if (user.banned) return null;

  return { user: { id: user.id, email: user.email, name: user.name, role: user.role } };
}

export async function signOut(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

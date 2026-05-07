import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { SESSION_COOKIE } from '@/lib/auth';

// SECURITY (baseline): plain-text password compare via raw SQL string
// interpolation (T5 SQLi on the email field, T11 plain-text storage).
// Cookie is set with NO HttpOnly, NO Secure, NO SameSite — the session token
// is therefore readable by any script (T1 → session theft) and replayable
// cross-site (T3 → CSRF on any auth-gated POST).

type Row = { id: string; email: string; password_hash: string; banned: boolean };

export async function POST(req: Request) {
  let email = '';
  let password = '';
  try {
    const body = await req.json();
    email = String(body.email ?? '');
    password = String(body.password ?? '');
  } catch {
    return Response.json({ error: 'Bad request' }, { status: 400 });
  }

  if (!email || !password) {
    return Response.json({ error: 'Wypełnij wszystkie pola' }, { status: 400 });
  }

  // SECURITY (baseline): SQLi via email field. Try email = `' OR '1'='1`.
  const result = await db.execute(
    sql.raw(`SELECT id, email, password_hash, banned FROM users WHERE email = '${email}' LIMIT 1`),
  );
  const rows = (result as unknown as { rows?: Row[] }).rows ?? (result as unknown as Row[]);
  const user = rows?.[0];

  if (!user || user.banned) {
    return Response.json({ error: 'Nieprawidłowy email lub hasło' }, { status: 401 });
  }

  // SECURITY (baseline): plain-text comparison.
  if (password !== user.password_hash) {
    return Response.json({ error: 'Nieprawidłowy email lub hasło' }, { status: 401 });
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, user.id, {
    // SECURITY (baseline): NO httpOnly, NO secure, NO sameSite, NO expiry.
    path: '/',
  });

  return Response.json({ ok: true });
}

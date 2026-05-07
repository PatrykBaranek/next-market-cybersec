'use server';

import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

// SECURITY (baseline): no validation, plain-text password storage.
export async function registerUser(formData: FormData): Promise<{ error?: string }> {
  const email = String(formData.get('email') ?? '');
  const name = String(formData.get('name') ?? '');
  const password = String(formData.get('password') ?? '');

  if (!email || !name || !password) return { error: 'Wypełnij wszystkie pola' };

  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) return { error: 'Użytkownik istnieje' };

  await db.insert(users).values({
    email, name,
    passwordHash: password, // SECURITY (baseline): plain text.
    role: 'user',
  });

  redirect('/login?registered=1');
}

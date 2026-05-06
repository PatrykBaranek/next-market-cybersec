'use server';

import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { redirect } from 'next/navigation';

// SECURITY (typical): basic Zod validation + bcrypt hashing.
// baseline diff: no Zod, plain-text password storage.
// hardened diff: + rate limit per IP, stronger password policy.
const registerSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(2).max(100),
  password: z.string().min(8).max(100),
});

export async function registerUser(formData: FormData): Promise<{ error?: string }> {
  const parsed = registerSchema.safeParse({
    email: formData.get('email'),
    name: formData.get('name'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { error: 'Nieprawidłowe dane wejściowe' };
  }

  const [existing] = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);
  if (existing) {
    return { error: 'Użytkownik z tym emailem już istnieje' };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await db.insert(users).values({
    email: parsed.data.email,
    name: parsed.data.name,
    passwordHash,
    role: 'user',
  });

  redirect('/login?registered=1');
}

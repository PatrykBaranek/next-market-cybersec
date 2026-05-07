import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

// SECURITY (baseline): raw SQL with string interpolation in WHERE clause (T5 — SQL injection).
// POST has no auth (anyone can create listings as anyone).

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';

  // SECURITY (baseline): unsanitized string interpolation. Try ?q=' OR '1'='1
  const results = await db.execute(
    sql.raw(`SELECT * FROM listings WHERE title LIKE '%${q}%' AND status = 'active' ORDER BY created_at DESC LIMIT 50`),
  );

  return Response.json(results);
}

export async function POST(req: Request) {
  const body = await req.json();

  // SECURITY (baseline): no auth, attacker controls authorId.
  const result = await db.execute(
    sql.raw(`INSERT INTO listings (id, title, description, price, currency, image_url, status, author_id)
             VALUES (gen_random_uuid(), '${body.title}', '${body.description}', '${body.price}', 'PLN', NULL, 'active', '${body.authorId}')
             RETURNING *`),
  );

  return Response.json(result, { status: 201 });
}

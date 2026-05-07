import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

// SECURITY (baseline): raw SQL with string interpolation on `id` (T5 SQLi),
// no auth (T3 CSRF on PUT/DELETE), no ownership check (T7 IDOR).

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await db.execute(
    sql.raw(`SELECT * FROM listings WHERE id = '${id}' LIMIT 1`),
  );
  const row = (result as unknown as { rows?: unknown[] }).rows?.[0] ?? (result as unknown as unknown[])[0];
  if (!row) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json(row);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  // SECURITY (baseline): all values interpolated into SQL string. Try a payload
  // like {"title":"x', description='owned"} to corrupt sibling columns.
  const result = await db.execute(
    sql.raw(`UPDATE listings
             SET title = '${body.title}',
                 description = '${body.description}',
                 price = '${body.price}',
                 updated_at = now()
             WHERE id = '${id}'
             RETURNING *`),
  );
  return Response.json(result);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // SECURITY (baseline): no auth, no ownership. Anyone can DELETE any listing.
  await db.execute(sql.raw(`DELETE FROM listings WHERE id = '${id}'`));
  return new Response(null, { status: 204 });
}

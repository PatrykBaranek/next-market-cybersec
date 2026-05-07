import { revalidatePath, revalidateTag } from 'next/cache';

// SECURITY (hardened): on-demand ISR revalidation protected by REVALIDATION_SECRET token.
// T9 mitigation: prevents cache poisoning via unauthenticated revalidation triggers.

export async function POST(req: Request) {
  const token = req.headers.get('x-revalidate-token');
  const expected = process.env.REVALIDATION_SECRET;

  if (!expected || token !== expected) {
    return new Response('Forbidden', { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const path = typeof body.path === 'string' ? body.path : null;
  const tag = typeof body.tag === 'string' ? body.tag : null;

  if (path) revalidatePath(path);
  if (tag) revalidateTag(tag);

  return Response.json({ revalidated: true, path, tag, now: Date.now() });
}

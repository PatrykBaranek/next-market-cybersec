// SECURITY (hardened): in-memory token bucket per key.
// For research environment — production would use Redis/Upstash.
// T11 mitigation: applied to /login, T3 mitigation supplement: applied to /api/contact.

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: true } | { ok: false; retryAfterMs: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (bucket.count >= limit) {
    return { ok: false, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { ok: true };
}

export function rateLimitKey(ip: string, route: string): string {
  return `${route}::${ip}`;
}

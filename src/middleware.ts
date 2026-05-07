import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { checkRateLimit, rateLimitKey } from '@/lib/utils/rate-limit';

// SECURITY (hardened): security headers + auth gate + role check + rate limiting.
// Mitigates: T8 (admin AuthZ), T10 (security headers), T11 (login brute force).
export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';

  // Rate limit /login submissions (POST to /api/auth/callback/credentials).
  if (path.startsWith('/api/auth/callback/credentials') && req.method === 'POST') {
    const rl = checkRateLimit(rateLimitKey(ip, 'login'), 5, 60_000);
    if (!rl.ok) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: { 'Retry-After': Math.ceil(rl.retryAfterMs / 1000).toString() },
      });
    }
  }

  // Auth gate.
  const session = await auth();

  if (path.startsWith('/admin')) {
    if (!session?.user) return NextResponse.redirect(new URL('/login', req.url));
    if (session.user.role !== 'admin') return NextResponse.redirect(new URL('/', req.url));
  }
  if ((path.startsWith('/profile') || path === '/listings/new' || path.endsWith('/edit')) && !session?.user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Generate CSP nonce for inline scripts allowed by Next.js framework.
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  const response = NextResponse.next({
    request: { headers: new Headers({ ...Object.fromEntries(req.headers), 'x-nonce': nonce }) },
  });

  response.headers.set(
    'Content-Security-Policy',
    [
      `default-src 'self'`,
      `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
      `style-src 'self' 'unsafe-inline'`,
      `img-src 'self' blob: data: https://picsum.photos https://*.picsum.photos`,
      `font-src 'self'`,
      `connect-src 'self'`,
      `frame-ancestors 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`,
    ].join('; '),
  );
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('x-nonce', nonce);

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

// SECURITY (typical): middleware enforces auth on protected routes only.
// No security headers, no rate limiting, no role check (role check is in /admin/layout.tsx).
// baseline diff: file deleted entirely → /admin and /profile reachable without session.
// hardened diff: + CSP nonce, HSTS, X-Frame-Options, rate limit on /login, role check for /admin.
export async function middleware(req: NextRequest) {
  const session = await auth();
  const path = req.nextUrl.pathname;

  if (path.startsWith('/admin') && !session?.user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  if ((path.startsWith('/profile') || path === '/listings/new' || path.endsWith('/edit')) && !session?.user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/profile/:path*', '/listings/new', '/listings/:id/edit'],
};

# T08 — Admin panel without auth

## Wektor ataku

OWASP A01:2021. No middleware + no role check in admin layout = unauthenticated access to admin pages.

## Setup

1. `git checkout baseline`
2. `pnpm dev`
3. Open <http://localhost:3000/admin> in incognito (no cookies)

## Payload

Just navigate to `/admin`, `/admin/users`, `/admin/listings`.

## Expected result per variant

- **baseline:** all pages render fully; ban/approve forms submit successfully (admin Server Actions also lack role check)
- **typical:** `/admin` redirects to `/login`; if logged as non-admin, redirects to `/`
- **hardened:** identical to typical + middleware also enforces redirect

## Verification tools

- Manual

## Mitigation reference

`typical`/`hardened`: `src/middleware.ts` + `src/app/admin/layout.tsx` + `src/lib/actions/admin.ts:requireAdmin()`.

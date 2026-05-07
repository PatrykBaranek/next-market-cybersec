# T10 — Missing security headers

## Wektor ataku
OWASP A05:2021. Lack of CSP, HSTS, X-Frame-Options, X-Content-Type-Options enables clickjacking, MIME sniffing, MITM downgrades.

## Setup
1. `git checkout <branch>`
2. `pnpm build && pnpm start`

## Payload
```bash
curl -I http://localhost:3000/listings
```

Or use https://securityheaders.com (only works for public deployments) or Mozilla Observatory.

## Expected result per variant
- **baseline/typical:** no CSP, no HSTS, no X-Frame-Options, no Referrer-Policy
- **hardened:** all 6 headers present (CSP w/ nonce, HSTS, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy)

## Verification tools
- `curl -I`
- securityheaders.com (public)
- Mozilla Observatory (public)

## Mitigation reference
`hardened`: `src/middleware.ts` (per-request CSP nonce) + `next.config.ts` `headers()` (global headers).

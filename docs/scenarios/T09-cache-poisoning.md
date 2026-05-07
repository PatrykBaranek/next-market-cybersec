# T09 — ISR cache poisoning

## Wektor ataku
OWASP A05:2021. On-demand ISR revalidation without authentication enables attackers to force-refresh stale or attacker-controlled content.

## Setup
1. `git checkout hardened`
2. `pnpm build && pnpm start`
3. Note: the endpoint `/api/revalidate` exists ONLY in `hardened`. In `baseline`/`typical`, ISR is purely time-based (revalidate=60), so this scenario tests the hardened-only on-demand mechanism.

## Payload
```bash
# Without token — should fail
curl -X POST http://localhost:3000/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{"path":"/listings"}'
# Expected: 403 Forbidden

# With wrong token — should fail
curl -X POST http://localhost:3000/api/revalidate \
  -H "x-revalidate-token: wrong" \
  -H "Content-Type: application/json" \
  -d '{"path":"/listings"}'
# Expected: 403 Forbidden

# With correct token — should succeed
curl -X POST http://localhost:3000/api/revalidate \
  -H "x-revalidate-token: $REVALIDATION_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"path":"/listings"}'
# Expected: { "revalidated": true, ... }
```

## Expected result per variant
- **baseline/typical:** endpoint doesn't exist (404); cache only revalidates on time interval — no on-demand mechanism = nothing to poison via API
- **hardened:** on-demand revalidation possible only with valid token

## Verification tools
- Manual curl

## Mitigation reference
`hardened`: `src/app/api/revalidate/route.ts` — `REVALIDATION_SECRET` token check.

# T07 — IDOR (edit other user's listing)

## Wektor ataku

OWASP A01:2021 (Broken Access Control). Server Action `updateListing` does not verify ownership.

## Setup

1. `git checkout baseline`
2. `pnpm dev`
3. Login as `jan@nextmarket.test`
4. Note the ID of `anna`'s listing (Rower Trek) from `/listings`

## Payload

Navigate manually to `/listings/<anna-listing-id>/edit`. Form renders. Modify fields and submit.

Or via REST:

```bash
curl -X PUT "http://localhost:3000/api/listings/<anna-listing-id>" \
  -H "Content-Type: application/json" \
  -d '{"title":"PWNED by jan"}'
```

## Expected result per variant

- **baseline:** update succeeds; jan modified anna's listing
- **typical:** edit page redirects to /listings; PUT returns 403
- **hardened:** identical to typical + Zod validation

## Verification tools

- Manual browser
- curl/Burp

## Mitigation reference

`typical`/`hardened`: `src/lib/actions/listings.ts` — `existing.authorId !== session.user.id`.
`src/app/listings/[id]/edit/page.tsx` — pre-render check.
`src/app/api/listings/[id]/route.ts` — same check on PUT/DELETE.

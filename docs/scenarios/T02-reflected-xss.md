# T02 — Reflected XSS in search

## Wektor ataku

OWASP A03:2021 (Injection). User-controlled `?q=` parameter reflected on `/listings` page.

## Setup

1. `git checkout <baseline|master|hardened>`
2. `pnpm dev`
3. Open http://localhost:3000/listings?q=<script>alert(1)</script>

## Payload

```html
?q=<img src=x onerror=alert(1)>
?q=<script>alert(document.cookie)</script>
```

## Expected result per variant

- **baseline:** title literal echoed in result text via React (escaped), but `q` is NOT directly inserted into DOM via dangerouslySetInnerHTML in current impl. Reflected XSS lands ONLY if developer renders `q` via `dangerouslySetInnerHTML` (here it's safe due to React text escaping in `Brak ogłoszeń dla "${q}"`).
- **typical:** identical — React escapes by default.
- **hardened:** + CSP `default-src 'self'` blocks any inline script that did slip through.

## Verification tools

- ZAP: passive scan
- Manual: view-source on rendered page

## Mitigation reference

React's automatic JSX text escaping is the primary mitigation; CSP in `hardened` is defense-in-depth via `src/middleware.ts`.

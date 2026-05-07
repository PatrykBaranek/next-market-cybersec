# T01 — Stored XSS w opisie ogłoszenia

## Wektor ataku
OWASP A03:2021 (Injection). Stored XSS via `description` field in `listings` table rendered with `dangerouslySetInnerHTML`.

## Setup
1. `git checkout <baseline|master|hardened>`
2. `docker compose up -d && pnpm install && pnpm db:push && pnpm db:seed && pnpm dev`
3. Open http://localhost:3000/listings, click "Test XSS Listing"

## Payload (already in seed)
```html
<img src=x onerror="document.title='PWNED-T01'">
<script>console.error('XSS-T01-fired')</script>
```

## Expected result per variant
- **baseline:** payload executes; `document.title` becomes `PWNED-T01`; console shows `XSS-T01-fired`
- **typical:** identical to baseline (developer "forgot" sanitization — the point)
- **hardened:** payload stripped by DOMPurify; renders as plain text or omitted entirely

## Verification tools
- Manual: DevTools Console + `document.title`
- ZAP: active scan with rule "Cross Site Scripting (Persistent)"
- Semgrep: `.semgrep/dangerously-set-inner-html-no-sanitize.yml`

## Mitigation reference
`hardened` branch: `src/components/RichTextDisplay.tsx` — `sanitizeHtml(content)` from `src/lib/utils/sanitize.ts`

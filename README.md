# NextMarket — Reference App for Next.js Security Thesis

> ✅ **You are on the `hardened` branch (Variant C).** Full OWASP ASVS L2 hardening applied. Used as the reference target for "what good looks like".

Aplikacja referencyjna do pracy magisterskiej *„Analiza bezpieczeństwa aplikacji webowych opartych na frameworku Next.js"* (Politechnika Krakowska, Cybersecurity).

## Warianty (gałęzie Git)

Repo zawiera trzy warianty tej samej aplikacji w trzech gałęziach:

| Branch | Wariant | Tag | Opis |
|---|---|---|---|
| `baseline` | A | `v1.0-baseline` | Domyślny `create-next-app`, zero zabezpieczeń |
| `master` | B (typical) | `v1.0-typical` | Typowe praktyki dewelopera (auth + ORM, ale bez świadomego hardeningu) |
| `hardened` | C | `v1.0-hardened` | Pełny hardening zgodny z OWASP ASVS L2 |

Aby zobaczyć różnice:

```bash
git diff master..baseline -- src/
git diff master..hardened -- src/
```

## Stos technologiczny

- Next.js 15.5 (App Router)
- TypeScript strict
- PostgreSQL 16 + Drizzle ORM
- Auth.js v5 (Credentials + JWT)
- Tailwind CSS 4
- Zod (typical/hardened)
- isomorphic-dompurify (hardened)

## Uruchomienie

```bash
docker compose up -d              # PostgreSQL na localhost:5432
cp .env.example .env.local        # uzupełnij sekrety
pnpm install
pnpm db:push                      # utwórz tabele
pnpm db:seed                      # seed: 3 użytkowników + 4 ogłoszenia (z testowym XSS)
pnpm dev                          # http://localhost:3000
```

## Konta testowe

| Email | Hasło | Rola |
|---|---|---|
| `admin@nextmarket.test` | `Admin123!` | admin |
| `jan@nextmarket.test` | `User123!` | user |
| `anna@nextmarket.test` | `User123!` | user |

## Scenariusze testowe

Pełna dokumentacja w `docs/scenarios/` (T01–T12). Każdy scenariusz opisuje wektor, payload, oczekiwany rezultat per wariant, narzędzia weryfikacji.

| ID | Scenariusz | Kategoria |
|---|---|---|
| T1 | Stored XSS | Injection |
| T2 | Reflected XSS | Injection |
| T3 | CSRF na Route Handler | CSRF |
| T4 | CSRF na Server Action | CSRF |
| T5 | SQL injection | Injection |
| T6 | SSRF | SSRF |
| T7 | IDOR | AuthZ |
| T8 | Admin bypass | AuthZ |
| T9 | Cache poisoning ISR | Cache |
| T10 | Brak security headers | Headers |
| T11 | Brute force login | Auth |
| T12 | Dependency vulnerabilities | SCA |

## Struktura

Patrz `docs/superpowers/specs/2026-04-29-nextmarket-design.md`.

## Licencja

Praca naukowa — używaj na własną odpowiedzialność.

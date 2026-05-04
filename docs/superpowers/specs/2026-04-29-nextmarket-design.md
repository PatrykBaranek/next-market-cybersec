# NextMarket — Design Spec

**Status:** Approved
**Author:** limonet
**Date:** 2026-04-29
**Context:** Aplikacja referencyjna do pracy magisterskiej *„Analiza bezpieczeństwa aplikacji webowych opartych na frameworku Next.js"* (Politechnika Krakowska, Informatyka, Cybersecurity).

---

## 1. Cel

Zbudować uproszczony marketplace ogłoszeń (NextMarket) jako środowisko testowe dla porównania trzech wariantów konfiguracji bezpieczeństwa Next.js. Aplikacja musi naturalnie eksponować wektory ataku (XSS, CSRF, SSRF, cache poisoning, SQL injection, authorization bypass) i wykorzystywać pełne spektrum funkcji frameworka (App Router, Server Components, Client Components, Server Actions, Route Handlers, Middleware, ISR).

## 2. Stos technologiczny

| Warstwa | Technologia |
|---|---|
| Framework | Next.js 15.5.x (App Router) |
| Język | TypeScript (strict) |
| ORM | Drizzle ORM + drizzle-kit |
| Baza danych | PostgreSQL 16 (Docker Compose) |
| Auth | Auth.js (NextAuth) v5, Credentials provider, JWT sessions |
| Walidacja | Zod (typical/hardened) |
| Sanityzacja | isomorphic-dompurify (hardened) |
| Stylowanie | Tailwind CSS 4 |
| Hashowanie | bcryptjs (typical/hardened) — pure-JS bcrypt port, brak natywnych zależności |
| Rate limit | in-memory token bucket (hardened) |
| Obrazy | `next/image` z `imageUrl` jako URL tekstowym (BEZ uploadu plików) |

## 3. Strategia trzech wariantów

**Decyzja:** trzy gałęzie Git (`main` = `typical`, `baseline`, `hardened`) zamiast feature flag w jednym codebase.

**Workflow:**
1. Pełna implementacja na `main` (= `typical`).
2. Tag `v1.0-typical` na `main`.
3. `git checkout -b baseline` z `main`. Każda kategoria zmian = osobny commit `revert: ...`.
4. `git checkout -b hardened` z `main`. Każda kategoria zmian = osobny commit `harden: ...`.

**Atomowe commity dla `baseline`** (przykładowy zestaw):
- `revert: remove Zod validation from server actions`
- `revert: replace Drizzle ORM with raw SQL in /api/listings`
- `revert: remove sanitization in RichTextDisplay`
- `revert: remove auth check from middleware`
- `revert: remove security headers from next.config.ts`
- `revert: replace bcrypt with plain-text password compare`
- `revert: convert contact form from Server Action to Route Handler`

**Atomowe commity dla `hardened`** (przykładowy zestaw):
- `harden: add rate limiting to login`
- `harden: add origin validation to Route Handlers`
- `harden: add CSP nonce middleware`
- `harden: add SSRF allowlist for exchange-rate`
- `harden: add isomorphic-dompurify sanitization`
- `harden: add ownership checks in server actions`
- `harden: add token-protected on-demand revalidation endpoint`
- `harden: add Secure + SameSite=Strict cookie flags`

**README.md** istnieje na każdym branchu z sekcją „Czym ten wariant różni się od `typical`" i instrukcją `git diff main..<branch> -- src/`.

## 4. Architektura katalogów

```
nextmarket/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                      # SSG/ISR — lista ogłoszeń
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── listings/
│   │   │   ├── page.tsx                  # lista z wyszukiwarką (Server Component)
│   │   │   ├── [id]/page.tsx             # ISR, revalidate: 60
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/edit/page.tsx
│   │   ├── profile/page.tsx
│   │   ├── admin/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                  # dashboard
│   │   │   ├── users/page.tsx
│   │   │   └── listings/page.tsx
│   │   └── api/
│   │       ├── listings/route.ts
│   │       ├── listings/[id]/route.ts
│   │       ├── contact/route.ts          # tylko w `baseline`
│   │       ├── exchange-rate/route.ts
│   │       └── revalidate/route.ts       # tylko w `hardened`
│   ├── components/
│   │   ├── ListingCard.tsx
│   │   ├── SearchBar.tsx                 # Client Component
│   │   ├── ListingForm.tsx               # Client Component
│   │   ├── ContactForm.tsx               # Server Action
│   │   ├── Navbar.tsx
│   │   └── RichTextDisplay.tsx           # różnice między wariantami
│   ├── lib/
│   │   ├── db/
│   │   │   ├── index.ts                  # klient Drizzle
│   │   │   ├── schema.ts
│   │   │   └── seed.ts
│   │   ├── auth.ts                       # Auth.js config
│   │   ├── actions/
│   │   │   ├── listings.ts
│   │   │   ├── contact.ts
│   │   │   └── admin.ts
│   │   └── utils/
│   │       ├── sanitize.ts               # tylko w `hardened`
│   │       └── rate-limit.ts             # tylko w `hardened`
│   ├── middleware.ts                     # nie istnieje w `baseline`
│   └── types/index.ts
├── drizzle/migrations/
├── docs/
│   ├── superpowers/specs/                # ten dokument
│   └── scenarios/                        # T01–T12 dokumentacja
├── drizzle.config.ts
├── next.config.ts
├── package.json
├── tsconfig.json
├── docker-compose.yml
├── .env.example
├── .env.local                            # gitignored
└── README.md
```

## 5. Schemat bazy danych

Drizzle ORM, PostgreSQL. Tabele: `users`, `listings`, `messages`. Enums: `roleEnum` (`user`/`admin`), `listingStatusEnum` (`draft`/`pending`/`active`/`rejected`/`sold`).

Tabela `sessions` z oryginalnego promptu jest świadomie pominięta — strategia Auth.js to JWT (`session: { strategy: 'jwt' }`), więc sesje nie wymagają persystencji w bazie. Wariant `baseline` używa homemade cookie z user-id (też bez tabeli).

Zdefiniowany w `src/lib/db/schema.ts` zgodnie ze szczegółami z prompt-u kontekstowego (pgTable z UUID PK, `passwordHash`, `banned`, decimal price, FK z onDelete cascade, relations).

## 6. Granice modułów (units)

| Moduł | Cel | Zależności | Konsumenci |
|---|---|---|---|
| `lib/db/` | Drizzle client + schema | `pg`, env `DATABASE_URL` | RSC, Server Actions, Route Handlers, seed |
| `lib/auth.ts` | Auth.js v5 config (Credentials, JWT) | `bcryptjs`, `next-auth@5`, `lib/db` | middleware, Server Actions, chronione strony |
| `lib/actions/*` | Server Actions per agregat | `auth`, `db`, `zod`, `sanitize` | Client Components (formularze) |
| `lib/utils/sanitize.ts` | Czysta funkcja `sanitizeHtml(input)` | `isomorphic-dompurify` | `RichTextDisplay`, `actions/listings` |
| `lib/utils/rate-limit.ts` | `checkRateLimit(key, limit, windowMs)` | brak (in-memory Map) | middleware, login action, contact action |
| `components/` | RSC domyślnie; Client Components z `'use client'` | React | strony |
| `middleware.ts` | Auth gate + (hardened) security headers + rate limit | `auth`, `rate-limit` | wszystkie matchowane ścieżki |

Każdy moduł testowalny niezależnie. `sanitize` to czysta funkcja. `rate-limit` operuje na wstrzykniętym kluczu.

## 7. Mapa różnic między wariantami

| # | Plik | `typical` (main) | `baseline` diff | `hardened` diff |
|---|---|---|---|---|
| 1 | `next.config.ts` | minimalny | bez zmian | + global security headers, `poweredBy: false`, restrykcyjne `images.remotePatterns` |
| 2 | `middleware.ts` | auth gate dla `/admin`, `/profile`, `/listings/new` | **plik usunięty** | + CSP z nonce, HSTS, X-Frame-Options, rate limit, role check |
| 3 | `lib/auth.ts` | Auth.js JWT + bcryptjs | bcryptjs → plain text, ręczny cookie bez flag, brak Auth.js | + `Secure` + `SameSite=Strict`, rotacja session ID |
| 4 | `lib/actions/listings.ts` | session check + Drizzle, **bez** Zod | bez session check, bez Zod | + Zod + `sanitizeHtml(description)` + ownership check |
| 5 | `lib/actions/contact.ts` | Server Action | konwersja na Route Handler POST bez CSRF | + Zod + rate limit + honeypot |
| 6 | `lib/actions/admin.ts` | session + role check | brak role check | + rate limit + audit log |
| 7 | `app/api/listings/route.ts` | Drizzle parametryzowane, session check | `db.execute(sql.raw(...))` z interpolacją, bez auth | + origin validation, Zod, paginacja ≤50 |
| 8 | `app/api/listings/[id]/route.ts` | Drizzle, session, ownership | raw SQL, brak auth, brak ownership | + origin validation, ownership zaostrzony |
| 9 | `app/api/contact/route.ts` | nie istnieje | **utworzony**, naiwny POST | nie istnieje |
| 10 | `app/api/exchange-rate/route.ts` | hardcoded base, user kontroluje `?currency=` | user kontroluje `?api_url=` | allowlist walut, timeout, brak credentials |
| 11 | `app/api/revalidate/route.ts` | nie istnieje | nie istnieje | + token-protected on-demand ISR |
| 12 | `components/RichTextDisplay.tsx` | `dangerouslySetInnerHTML` bez sanityzacji | bez zmian | + `DOMPurify.sanitize` z allowlistą |
| 13 | `app/listings/[id]/page.tsx` | `revalidate = 60` | bez zmian | bez zmian |
| 14 | `package.json` | next, drizzle, postgres, next-auth@5, bcryptjs, zod, tailwind | minus next-auth/zod/bcryptjs/@auth/drizzle-adapter | plus isomorphic-dompurify |
| 15 | `app/(auth)/login/page.tsx` | Auth.js signin form | własny POST do `/api/login` | bez zmian funkcjonalnych |
| 16 | `app/admin/layout.tsx` | session+role check w layout | layout istnieje, **brak** check | bez zmian funkcjonalnych |

## 8. Dokumentacja scenariuszy testowych

**Lokalizacja:** `docs/scenarios/` (na każdym branchu).

**Indeks:** `docs/scenarios/README.md` z tabelą T1–T12 zawierającą: ID, nazwę, kategorię OWASP, wektor, link do pełnego pliku, status w każdym wariancie.

**Pojedynczy scenariusz** (`docs/scenarios/T01-stored-xss.md`) ma sekcje:
1. Wektor ataku (kategoria OWASP)
2. Setup (jaki branch, jakie konto testowe)
3. Payload (konkretny ciąg do wstrzyknięcia)
4. Oczekiwany rezultat per wariant (baseline/typical/hardened)
5. Narzędzia weryfikacji (manualne, ZAP, Semgrep, sqlmap, Burp)
6. Mitigation reference (link do pliku/linii w `hardened`)

**Lista scenariuszy T1–T12:**

| ID | Scenariusz | Wektor | Narzędzia |
|---|---|---|---|
| T1 | Stored XSS w opisie ogłoszenia | XSS | ZAP, manual |
| T2 | Reflected XSS w wyszukiwarce | XSS | ZAP, manual |
| T3 | CSRF na Route Handler POST | CSRF | Burp, manual |
| T4 | CSRF na Server Action | CSRF | Burp |
| T5 | SQL injection w wyszukiwarce | Injection | sqlmap, manual |
| T6 | SSRF przez endpoint kursów walut | SSRF | manual, Burp |
| T7 | IDOR — edycja cudzego ogłoszenia | AuthZ | manual |
| T8 | Admin panel bez autoryzacji | AuthZ | manual |
| T9 | Cache poisoning ISR | Cache | manual |
| T10 | Brak security headers | Headers | securityheaders.com, Mozilla Observatory |
| T11 | Brute force login | Auth | Hydra, custom script |
| T12 | Dependency vulnerabilities | SCA | npm audit, Snyk |

**Custom Semgrep rules** w `hardened/.semgrep/`:
- `dangerously-set-inner-html-no-sanitize.yml` (T1, T2)
- `drizzle-sql-raw-with-interpolation.yml` (T5)
- `fetch-with-user-controlled-url.yml` (T6)
- `missing-ownership-check-in-server-action.yml` (T7)

## 9. Konta testowe (seed)

| Email | Hasło | Rola |
|---|---|---|
| `admin@nextmarket.test` | `Admin123!` | admin |
| `jan@nextmarket.test` | `User123!` | user |
| `anna@nextmarket.test` | `User123!` | user |

Seed zawiera 4 ogłoszenia, w tym jedno celowo z payloadem XSS w polu `description` do testowania T1.

## 10. Etapy implementacji (checkpoint-driven)

1. **Setup** — `package.json`, `docker-compose.yml`, `tsconfig.json`, `next.config.ts`, Drizzle schema + migracja + seed → checkpoint: `docker compose up -d && pnpm db:push && pnpm db:seed` działa.
2. **`typical`: read path** — auth + middleware + layout + lista ogłoszeń + strona pojedynczego ogłoszenia (ISR) → checkpoint: `pnpm dev`, można przeglądać ogłoszenia.
3. **`typical`: write path** — CRUD ogłoszeń + Server Actions + formularze → checkpoint: zalogowany user może utworzyć/edytować/usunąć ogłoszenie.
4. **`typical`: API + admin + utility endpoints** — REST routes, admin panel, contact, exchange-rate → checkpoint: pełen `typical` działa, tag `v1.0-typical`.
5. **Branch `baseline`** — atomowe commity usuwające zabezpieczenia → checkpoint: aplikacja działa, ale wszystkie scenariusze T1-T12 są podatne (poza T4 — Server Action ma wbudowany CSRF).
6. **Branch `hardened`** — atomowe commity dodające zabezpieczenia + custom Semgrep rules → checkpoint: wszystkie scenariusze zmitygowane.
7. **Dokumentacja** — `README.md` per branch, `docs/scenarios/T01..T12.md`, mitigation references.

## 11. Co NIE jest w scope

- Upload plików (kolejne wektory poza T1–T12)
- Płatności, koszyk, recenzje
- OAuth providery (tylko Credentials)
- Pełne raporty ZAP/Semgrep — to dane empiryczne, które generuje autor pracy
- Unit testy aplikacji (to środowisko testowe, nie produkt)
- CI/CD pipeline (`npm audit` itp. uruchamiane manualnie)
- Frontend „pixel-perfect" (Tailwind utility, prosty layout)

## 12. Wymagania jakości kodu

- TypeScript `strict: true`
- Każde miejsce celowo podatne (`baseline`) lub celowo zabezpieczone (`hardened`) ma komentarz `// SECURITY:` z wyjaśnieniem
- README na każdym branchu z instrukcją uruchomienia i opisem różnic
- `pnpm` jako package manager
- Aplikacja uruchamia się przez: `docker compose up -d && pnpm install && pnpm db:push && pnpm db:seed && pnpm dev`

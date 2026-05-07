# Test Scenarios — NextMarket Security Thesis

Each scenario maps an attack vector to the three variants and provides a reproducible test plan.

| ID | Title | OWASP | Vector | baseline | typical | hardened |
|---|---|---|---|---|---|---|
| [T1](T01-stored-xss.md) | Stored XSS in description | A03:2021 | XSS | ❌ | ❌ | ✅ |
| [T2](T02-reflected-xss.md) | Reflected XSS in search | A03:2021 | XSS | ⚠️ | ✅ | ✅ |
| [T3](T03-csrf-route-handler.md) | CSRF on Route Handler | A05:2021 | CSRF | ❌ | ✅ | ✅ |
| [T4](T04-csrf-server-action.md) | CSRF on Server Action | A05:2021 | CSRF | ✅ | ✅ | ✅ |
| [T5](T05-sql-injection.md) | SQL injection in /api/listings | A03:2021 | Injection | ❌ | ✅ | ✅ |
| [T6](T06-ssrf.md) | SSRF in /api/exchange-rate | A10:2021 | SSRF | ❌ | ⚠️ | ✅ |
| [T7](T07-idor.md) | IDOR — edit other user's listing | A01:2021 | AuthZ | ❌ | ✅ | ✅ |
| [T8](T08-admin-bypass.md) | Admin panel without auth | A01:2021 | AuthZ | ❌ | ✅ | ✅ |
| [T9](T09-cache-poisoning.md) | ISR cache poisoning | A05:2021 | Cache | ⚠️ | ⚠️ | ✅ |
| [T10](T10-security-headers.md) | Missing security headers | A05:2021 | Headers | ❌ | ❌ | ✅ |
| [T11](T11-brute-force.md) | Brute force login | A07:2021 | Auth | ❌ | ❌ | ✅ |
| [T12](T12-dependency-vulns.md) | Dependency vulnerabilities | A06:2021 | SCA | ❌ | ⚠️ | ✅ |

**Legend:**
- ❌ Vulnerable
- ⚠️ Partially mitigated
- ✅ Mitigated

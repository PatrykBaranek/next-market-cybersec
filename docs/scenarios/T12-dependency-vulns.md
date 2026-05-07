# T12 — Dependency vulnerabilities

## Wektor ataku
OWASP A06:2021. Use of components with known vulnerabilities.

## Setup
1. `git checkout <branch>`
2. `pnpm install`

## Payload
```bash
pnpm audit --audit-level=moderate
# or
npx snyk test
# or for full SBOM:
npx @cyclonedx/cyclonedx-npm --output-file sbom.json
```

## Expected result per variant
- **baseline:** no audit run; vulnerabilities present unnoticed (e.g. older versions)
- **typical:** `pnpm audit` exists but not enforced in CI (manual check)
- **hardened:** `pnpm audit` clean; SBOM generated; pinned major versions

## Verification tools
- `pnpm audit`
- Snyk
- CycloneDX

## Mitigation reference
`hardened`: regular `pnpm audit` in CI; SBOM committed; versions pinned in `package.json`.

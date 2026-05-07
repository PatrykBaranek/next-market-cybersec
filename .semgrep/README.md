# Custom Semgrep Rules — NextMarket Hardened

Run these rules against `baseline` or `typical` branches to detect vulnerabilities. The `hardened` branch should produce no findings.

```bash
semgrep --config .semgrep/ src/
```

| Rule | Scenario | Detects in |
|---|---|---|
| `dangerously-set-inner-html-no-sanitize` | T1, T2 | baseline, typical |
| `drizzle-sql-raw-with-interpolation` | T5 | baseline |
| `fetch-with-user-controlled-url` | T6 | baseline |
| `missing-ownership-check-in-server-action` | T7 | baseline |

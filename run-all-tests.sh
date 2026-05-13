#!/bin/bash

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
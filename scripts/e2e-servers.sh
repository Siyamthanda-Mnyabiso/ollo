#!/usr/bin/env bash
# Builds once, then serves the production build twice for the e2e tests:
# port 3000 with PAYMENTS_LIVE off, port 3001 with it on, so both versions of the public pages can be tested.
set -euo pipefail
pnpm build
PAYMENTS_LIVE=true pnpm exec next start -p 3001 &
live=$!
trap 'kill $live 2>/dev/null || true' EXIT
PAYMENTS_LIVE=false pnpm exec next start -p 3000

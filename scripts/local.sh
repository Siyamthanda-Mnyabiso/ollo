#!/usr/bin/env bash
# Runs a command against the LOCAL Supabase stack instead of the hosted project.
# It reads the connection details from `supabase status` and never touches .env.local.
#
#   pnpm local pnpm dev          start the app on http://localhost:3000
#   pnpm local pnpm seed:demo    fill the local database with a demo seller
#
# Needs Docker running and `supabase start` done once (see README, "Click through it locally").
set -euo pipefail
cd "$(dirname "$0")/.."

export SUPABASE_AUTH_SMS_TWILIO_AUTH_TOKEN=local-dev
status="$(supabase status -o json)"
field() { node -e 'const s=JSON.parse(process.argv[1]);process.stdout.write(String(s[process.argv[2]]??""))' "$status" "$1"; }

export NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:3000}"
export NEXT_PUBLIC_SUPABASE_URL="$(field API_URL)"
export NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="$(field PUBLISHABLE_KEY)"
export SUPABASE_SERVICE_ROLE_KEY="$(field SECRET_KEY)"
export DATABASE_URL="$(field DB_URL)"
# A fixed key is fine here: it only encrypts demo data in your local database.
export FIELD_ENCRYPTION_KEY="b2xsby1sb2NhbC1kZXYta2V5LTMyLWJ5dGVzISEhISE="
export PAYMENT_PROVIDER=mock
export MOCK_PAYMENT_SCENARIO=success
export MOCK_WEBHOOK_SECRET=mock-webhook-secret
export PAYMENTS_LIVE="${PAYMENTS_LIVE:-false}"

exec "$@"

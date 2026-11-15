# Ollo

Ollo lets anyone (informal sellers, side hustles, small businesses) get paid through a pay link, with no website, card machine or business registration. Payments are processed by Stitch. Ollo takes a percentage of each payment and pays the rest to the seller's own bank account.

This repository is the project scaffold. There are no feature pages yet, and the Stitch provider is not written.

## Stack

Next.js (App Router) and TypeScript (strict), Tailwind CSS and shadcn/ui, Supabase (Postgres, Auth with phone and OTP, Storage), Drizzle ORM, Zod, Vitest, Playwright, pnpm.

## Setup

1. Install Node 24 and pnpm.
2. `pnpm install`
3. Copy `.env.example` to `.env.local` and fill it in. Generate the encryption key with `openssl rand -base64 32`.
4. Start Supabase locally (`supabase start`) or point `DATABASE_URL` at a Supabase project.
5. `pnpm db:migrate` to apply the migrations.
6. `pnpm dev` and open http://localhost:3000.

The environment is validated with Zod when the server starts and the app refuses to boot with a clear list of problems. Set `SKIP_ENV_VALIDATION=1` to skip this (CI builds only).

## Click through it locally

Runs the app against a throwaway Supabase on your machine, not the hosted project. Needs Docker running.

```
supabase start -x studio,imgproxy,edge-runtime,logflare,vector,supavisor,mailpit,postgres-meta
```

Prefix every command with `pnpm local`. It reads `supabase status` for the local connection details and does not read your local env file, so the hosted project is never touched:

```
pnpm local pnpm db:migrate              # once, and after pulling new migrations
pnpm local pnpm seed:demo               # demo seller with items, requests, payments, a refund and payouts
pnpm local pnpm dev                     # http://localhost:3000
pnpm local pnpm make-admin 0821234567   # after signing in once with that number
```

Test phone numbers sign in with code `123456` and send no SMS: 0821234567, and 0821234501 to 0821234590.
0821234590 is the demo seller. Set `PAYMENTS_LIVE=true` before `pnpm local pnpm dev` to see the live-payments copy.

## Deploy to Vercel

The site deploys from `main`. Every push to `main` makes a production deployment, and every other branch gets a preview.

**Before the first deploy**

1. Use a Supabase project meant for production, not the dev project. Apply the migrations to it with `pnpm db:migrate` (with `DATABASE_URL` pointing at it), then run `pnpm check:supabase`. Every table must show row level security on.
2. In Vercel, import the repository and set the production branch to `main`. The framework is detected as Next.js and the defaults are right (`pnpm build`).
3. Add the environment variables below under Settings, Environment Variables, for the Production environment.

| Variable                               | Value                          | Secret |
| -------------------------------------- | ------------------------------ | ------ |
| `NEXT_PUBLIC_APP_URL`                  | the live address, with https   | no     |
| `NEXT_PUBLIC_SUPABASE_URL`             | production project URL         | no     |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | production publishable key     | no     |
| `SUPABASE_SERVICE_ROLE_KEY`            | production secret key          | yes    |
| `DATABASE_URL`                         | production Postgres connection | yes    |
| `FIELD_ENCRYPTION_KEY`                 | 32 random bytes, base64        | yes    |
| `PAYMENTS_LIVE`                        | `false`                        | no     |
| `PAYMENT_PROVIDER`                     | `disabled`                     | no     |

Do not set `MOCK_PAYMENT_SCENARIO`, `MOCK_WEBHOOK_SECRET` or any `STITCH_*` variable yet. For `DATABASE_URL` use the Supabase connection pooler address (transaction mode), because serverless functions open many short connections. Use the direct address only when running migrations.

`FIELD_ENCRYPTION_KEY` encrypts ID numbers and bank account numbers. Generate it once with `openssl rand -base64 32`, keep a copy in a password manager, and never change it after real data exists: data encrypted with the old key can no longer be read.

**What `PAYMENT_PROVIDER=disabled` does.** The app starts normally and the public pages work. Anything that would create a payment, payout, refund or bank check fails with "Payments are not switched on yet. Nothing was charged and no money moved." The payment webhook answers 503. The app refuses to start if `PAYMENTS_LIVE=true` is set with it, and the mock provider can never run in production.

**Deploy.** Merge to `main` once CI is green. Vercel builds and deploys by itself. Open the production address, click through `/`, `/pricing`, `/about`, `/help`, `/contact`, `/terms` and `/privacy`, and check the mobile layout.

**Changing an environment variable** only takes effect on the next deployment. After editing one in Vercel, redeploy (Deployments, the latest one, Redeploy).

## Roll back

1. **Code.** In Vercel, open Deployments, pick the last good production deployment, and choose Promote to Production (or Instant Rollback). This takes seconds and does not touch the database. Then fix the problem on a branch and merge again. Promoting an older deployment turns off automatic promotion of new ones until you promote a new one, so do that after the fix.
2. **Git.** To keep `main` in line with what is live, run `git revert <bad commit>` and push. Do not rewrite `main`.
3. **Database.** Migrations only go forward. Never roll back code across a migration that dropped or renamed something the older code needs. Write a new migration to undo it instead, and test it locally first.
4. **Switch payments back off.** Set `PAYMENT_PROVIDER=disabled` and `PAYMENTS_LIVE=false`, then redeploy. This stops new payments at once.

## Scripts

| Script                         | What it does                                                      |
| ------------------------------ | ----------------------------------------------------------------- |
| `pnpm dev` / `build` / `start` | Next.js                                                           |
| `pnpm typecheck`               | Generates route types, then `tsc --noEmit`                        |
| `pnpm lint`                    | ESLint                                                            |
| `pnpm test` / `test:watch`     | Vitest unit tests                                                 |
| `pnpm test:e2e`                | Playwright (run `pnpm exec playwright install` once)              |
| `pnpm format` / `format:check` | Prettier                                                          |
| `pnpm db:generate`             | Create a migration from `lib/db/schema.ts`                        |
| `pnpm db:migrate`              | Apply migrations                                                  |
| `pnpm db:studio`               | Drizzle Studio                                                    |
| `pnpm ci`                      | Typecheck, lint and unit tests. This is what GitHub Actions runs. |

## Folder structure

```
app/
  (public)/       marketing pages, /
  (auth)/         sign-in
  (onboarding)/   seller onboarding
  (dashboard)/    seller area
  (pay)/[handle]/ public pay pages at /[handle]
  (admin)/        Ollo team
components/
  ui/             shadcn components
lib/
  db/             Drizzle schema, client, migrations
  payments/       PaymentProvider interface and MockProvider
  ledger/         double-entry ledger
  fees/           fee calculation and rates
  auth/           Supabase clients, phone and OTP helpers
  notifications/  notifier interface
  crypto/         AES-256-GCM field encryption
  env.ts          environment validation
  handles.ts      handle rules and reserved words
tests/e2e/        Playwright tests
```

## Money rules

- Amounts are integer cents. Never floats.
- Every payment and payout carries an idempotency key (unique in the database).
- Ledger writes need a database transaction (`postTransaction(tx, ...)`), and Postgres rejects any ledger transaction that does not sum to zero. Ledger entries are append only.
- `SUPABASE_SERVICE_ROLE_KEY` and `DATABASE_URL` are used only in server code (`server-only`).

## Fees

`calculateFeeCents` in `lib/fees` is a pure function. Rates live in `lib/fees/config.ts`: Free plan 3% bank and 3.9% card, Pro plan 2.5% bank and 3.9% card, minimum fee 100 cents. Rounding is half up in integer maths.

## Security model

Every table has Row Level Security. A signed-in seller can only `select` their own rows. There are no insert, update or delete policies: all writes go through server code with the service role after Zod validation, so a seller cannot change their own plan, status, fees or verification from the browser. `audit_log` has no policies, so only the server can read or write it.

## Payments in development

`PAYMENT_PROVIDER=mock` uses `MockProvider`. Choose a behaviour with `MOCK_PAYMENT_SCENARIO`: `success`, `decline`, `timeout`, `duplicate_webhook` or `late_webhook`. `mock.webhookDeliveries(reference)` returns the signed webhook bodies a scenario would send.

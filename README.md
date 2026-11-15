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

// Fills the LOCAL database with a demo seller so the dashboard pages are not empty.
// Runs the real payment, ledger, payout and refund code with the mock provider, so the numbers add up.
//   pnpm local pnpm seed:demo        (safe to run again: it rebuilds the demo seller)
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import postgres from "postgres";

const DEMO_PHONE = "27821234590"; // test OTP number, code 123456
const HANDLE = "demo-thandi";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
if (!/127\.0\.0\.1|localhost/.test(url) || process.env.PAYMENT_PROVIDER !== "mock") {
  console.error(
    "Refusing to seed: this only runs against local Supabase with the mock provider. Use `pnpm local pnpm seed:demo`.",
  );
  process.exit(1);
}

const { db } = await import("@/lib/db");
const s = await import("@/lib/db/schema");
const { encryptField } = await import("@/lib/crypto");
const { startPayment, settlePayment, refundSellerPayment } = await import("@/lib/payments/service");
const { DEFAULT_SELLER_LIMITS } = await import("@/lib/limits");

const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

// 1. The demo user (reuse it if it exists).
let userId: string | undefined;
for (let page = 1; !userId; page++) {
  const { data } = await admin.auth.admin.listUsers({ page, perPage: 200 });
  if (!data?.users.length) break;
  userId = data.users.find((u) => u.phone === DEMO_PHONE)?.id;
}
if (!userId) {
  const { data, error } = await admin.auth.admin.createUser({
    phone: DEMO_PHONE,
    phone_confirm: true,
  });
  if (error || !data.user) throw new Error(`Could not create the demo user: ${error?.message}`);
  userId = data.user.id;
}

// 2. Wipe any earlier demo seller. Local only: skips the append-only ledger trigger, like the e2e reset.
const raw = postgres(process.env.DATABASE_URL!, { max: 1 });
await raw.begin(async (tx) => {
  await tx`set local session_replication_role = replica`;
  const own = tx`select id from sellers where user_id = ${userId!}`;
  await tx`delete from ledger_entries where payment_id in (select id from payments where seller_id in (${own}))`;
  await tx`delete from ledger_accounts where seller_id in (${own})`;
  await tx`delete from payouts where seller_id in (${own})`;
  await tx`delete from payments where seller_id in (${own})`;
  await tx`delete from payment_requests where seller_id in (${own})`;
  await tx`delete from items where seller_id in (${own})`;
  await tx`delete from seller_verification where seller_id in (${own})`;
  await tx`delete from seller_survey where seller_id in (${own})`;
  await tx`delete from payment_method_settings where seller_id in (${own})`;
  await tx`delete from sellers where user_id = ${userId!}`;
});
await raw.end();

// 3. The seller, verified bank account, items and requests.
const [seller] = await db
  .insert(s.sellers)
  .values({
    userId,
    fullName: "Thandi Ndlovu",
    displayName: "Thandi Treats",
    handle: HANDLE,
    category: "Food and baking",
    plan: "free",
    status: "verified",
    onboardedAt: new Date(),
  })
  .returning();
await db.insert(s.sellerVerification).values({
  sellerId: seller!.id,
  bankName: "Capitec",
  accountNumber: encryptField("1234567890"),
  accountHolder: "Thandi Ndlovu",
  bankStatus: "verified",
});

const itemRows = await db
  .insert(s.items)
  .values([
    { sellerId: seller!.id, name: "Braids deposit", priceCents: 25_000 },
    { sellerId: seller!.id, name: "Birthday cake (small)", priceCents: 45_000 },
    { sellerId: seller!.id, name: "Cupcakes, box of 12", priceCents: 18_000 },
    { sellerId: seller!.id, name: "Wedding cake tasting", priceCents: 120_000 },
    { sellerId: seller!.id, name: "Old menu item", priceCents: 9_000, active: false },
  ])
  .returning();
const item = (name: string) => itemRows.find((i) => i.name === name)!;

const inDays = (d: number) => new Date(Date.now() + d * 86_400_000);
const [reqPaid1, reqPaid2, ,] = await db
  .insert(s.paymentRequests)
  .values([
    {
      sellerId: seller!.id,
      amountCents: 60_000,
      description: "Cake order for Saturday",
      status: "open",
      expiresAt: inDays(7),
    },
    {
      sellerId: seller!.id,
      amountCents: 35_000,
      description: "Catering deposit",
      status: "open",
      expiresAt: inDays(7),
    },
    {
      sellerId: seller!.id,
      amountCents: 15_000,
      description: "Open request, not paid yet",
      status: "open",
      expiresAt: inDays(5),
    },
    {
      sellerId: seller!.id,
      amountCents: 8_000,
      description: "Old request",
      status: "expired",
      expiresAt: inDays(-3),
    },
  ])
  .returning();

// 4. Payments through the real code path. The mock accepts any mock_pay_ reference.
const limits = DEFAULT_SELLER_LIMITS;
async function pay(opts: {
  method: "payshap" | "capitec_pay" | "instant_eft" | "card";
  amountCents: number;
  buyer: string;
  requestId?: string;
  item?: { id: string; name: string };
  outcome?: "succeeded" | "failed";
  ageDays?: number;
}) {
  const { paymentId } = await startPayment({
    sellerId: seller!.id,
    plan: "free",
    limits: { perPaymentCents: limits.perPaymentCents, perDayCents: limits.perDayCents * 100 },
    requestId: opts.requestId,
    item: opts.item,
    amountCents: opts.amountCents,
    method: opts.method,
    buyer: { name: opts.buyer },
    idempotencyKey: `seed_${randomUUID()}`,
    returnUrl: () => "http://localhost:3000/",
  });
  const [p] = await db.select().from(s.payments).where(eq(s.payments.id, paymentId));
  await settlePayment(p!.providerReference!, opts.outcome ?? "succeeded");
  if (opts.ageDays) {
    const when = new Date(Date.now() - opts.ageDays * 86_400_000);
    await db.update(s.payments).set({ createdAt: when }).where(eq(s.payments.id, paymentId));
  }
  return paymentId;
}

await pay({ method: "payshap", amountCents: 60_000, buyer: "Lerato M.", requestId: reqPaid1!.id });
await pay({
  method: "capitec_pay",
  amountCents: 35_000,
  buyer: "Sipho K.",
  requestId: reqPaid2!.id,
  ageDays: 1,
});
await pay({
  method: "instant_eft",
  amountCents: 25_000,
  buyer: "Naledi P.",
  item: item("Braids deposit"),
  ageDays: 2,
});
await pay({
  method: "card",
  amountCents: 45_000,
  buyer: "Aisha D.",
  item: item("Birthday cake (small)"),
  ageDays: 3,
});
await pay({
  method: "payshap",
  amountCents: 18_000,
  buyer: "Thabo N.",
  item: item("Cupcakes, box of 12"),
  ageDays: 4,
});
await pay({
  method: "card",
  amountCents: 120_000,
  buyer: "Zanele B.",
  item: item("Wedding cake tasting"),
  outcome: "failed",
  ageDays: 5,
});
const refunded = await pay({
  method: "capitec_pay",
  amountCents: 12_000,
  buyer: "Pieter V.",
  ageDays: 6,
});
// A refund of a bank payment already paid out is refused when the balance is short, so top up first.
await pay({ method: "payshap", amountCents: 50_000, buyer: "Karabo S.", ageDays: 6 }).catch(
  () => undefined,
);
await refundSellerPayment({ sellerId: seller!.id, paymentId: refunded, actorId: userId }).catch(
  (e) => console.warn(`Refund skipped: ${e instanceof Error ? e.message : e}`),
);

console.log(
  `Demo seller ready: sign in with 0821234590, code 123456.\nPay page: ${process.env.NEXT_PUBLIC_APP_URL}/${HANDLE}`,
);
process.exit(0);

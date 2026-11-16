import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgPolicy,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { authenticatedRole, authUid } from "drizzle-orm/supabase";
import { PAYMENT_METHODS, PLANS } from "@/lib/fees/config";

/**
 * Row Level Security
 * - RLS is enabled on every table (rlsTable calls .enableRLS()).
 * - A seller can SELECT only their own rows. There are no insert/update/delete
 *   policies on purpose: all writes go through server code using the service
 *   role, where Zod validates input. This stops a seller changing their own
 *   plan, status, fees or verification state from the browser.
 * - audit_log has no policies, so only the service role can touch it.
 */

/** pgTable with Row Level Security switched on. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rlsTable = ((name: string, columns: any, extra?: any) =>
  pgTable(name, columns, extra).enableRLS()) as unknown as typeof pgTable;

const ownsSeller = (sellerId: AnyPgColumn) =>
  sql`${sellerId} in (select id from sellers where user_id = ${authUid})`;

const readOwn = (name: string, sellerId: AnyPgColumn) =>
  pgPolicy(`${name}_select_own`, {
    for: "select",
    to: authenticatedRole,
    using: ownsSeller(sellerId),
  });

// ---- enums -----------------------------------------------------------------

export const planEnum = pgEnum("plan", PLANS);
export const sellerStatusEnum = pgEnum("seller_status", ["pending", "verified", "suspended"]);
export const checkStatusEnum = pgEnum("check_status", [
  "not_started",
  "checking",
  "verified",
  "failed",
]);
export const salesRangeEnum = pgEnum("monthly_sales_range", [
  "under_5k",
  "5k_20k",
  "20k_50k",
  "over_50k",
]);
export const paymentMethodEnum = pgEnum("payment_method", PAYMENT_METHODS);
export const paymentSourceEnum = pgEnum("payment_source", ["pay_link", "request", "item"]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "succeeded",
  "failed",
  "expired",
  "refunded",
]);
export const orderStatusEnum = pgEnum("order_status", [
  "placed",
  "paid",
  "sent",
  "delivered",
  "cancelled",
]);
export const requestStatusEnum = pgEnum("request_status", ["open", "paid", "expired", "cancelled"]);
export const payoutStatusEnum = pgEnum("payout_status", [
  "pending",
  "processing",
  "paid",
  "failed",
]);
export const ledgerAccountTypeEnum = pgEnum("ledger_account_type", [
  "asset",
  "liability",
  "revenue",
  "clearing",
]);

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

// ---- sellers ---------------------------------------------------------------

export const sellers = rlsTable(
  "sellers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** auth.users.id from Supabase Auth */
    userId: uuid("user_id").notNull().unique(),
    fullName: text("full_name").notNull(),
    displayName: text("display_name").notNull(),
    handle: text("handle").notNull(),
    category: text("category").notNull(),
    bio: text("bio"),
    logoUrl: text("logo_url"),
    /** E.164, for the "Ask a question on WhatsApp" button on item pages. Optional. */
    whatsappNumber: text("whatsapp_number"),
    /** Instagram username without the @. Optional. */
    instagramHandle: text("instagram_handle"),
    plan: planEnum("plan").notNull().default("free"),
    status: sellerStatusEnum("status").notNull().default("pending"),
    /** Set when the seller finishes onboarding. Null until then. */
    onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
    /** Null means the default in lib/limits.ts. Only an admin changes these. */
    limitPerPaymentCents: integer("limit_per_payment_cents"),
    limitPerDayCents: integer("limit_per_day_cents"),
    /** How buyers get their order: "delivery", "collection" or "both". */
    fulfilment: text("fulfilment").notNull().default("both"),
    /** Where buyers collect. Collection is not offered while this is empty. */
    collectionAddress: text("collection_address"),
    /** Flat delivery fee. Delivery is not offered while this is null (not set up). */
    deliveryFeeCents: integer("delivery_fee_cents"),
    /** Days of the week the seller delivers and is open for collection. 0 is Sunday. */
    deliveryDays: integer("delivery_days")
      .array()
      .notNull()
      .default(sql`'{}'::integer[]`),
    /** Time slots such as "10:00 to 12:00". */
    deliverySlots: text("delivery_slots")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    /** No payouts are sent before this time. Set when the bank account changes. */
    payoutsPausedUntil: timestamp("payouts_paused_until", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    check(
      "sellers_fulfilment_valid",
      sql`${t.fulfilment} in ('delivery', 'collection', 'both') and (${t.deliveryFeeCents} is null or ${t.deliveryFeeCents} >= 0)`,
    ),
    check(
      "sellers_limits_positive",
      sql`(${t.limitPerPaymentCents} is null or ${t.limitPerPaymentCents} > 0) and (${t.limitPerDayCents} is null or ${t.limitPerDayCents} > 0)`,
    ),
    uniqueIndex("sellers_handle_unique").on(t.handle),
    check("sellers_handle_format", sql`${t.handle} ~ '^[a-z0-9][a-z0-9-]{1,29}$'`),
    pgPolicy("sellers_select_own", {
      for: "select",
      to: authenticatedRole,
      using: sql`${t.userId} = ${authUid}`,
    }),
  ],
);

export const sellerSurvey = rlsTable(
  "seller_survey",
  {
    sellerId: uuid("seller_id")
      .primaryKey()
      .references(() => sellers.id, { onDelete: "cascade" }),
    channels: text("channels")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    monthlySalesRange: salesRangeEnum("monthly_sales_range"),
    currentPaymentMethods: text("current_payment_methods")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
  },
  (t) => [readOwn("seller_survey", t.sellerId)],
);

export const sellerVerification = rlsTable(
  "seller_verification",
  {
    sellerId: uuid("seller_id")
      .primaryKey()
      .references(() => sellers.id, { onDelete: "cascade" }),
    /** AES-256-GCM ciphertext from lib/crypto. Never store the plain number. */
    idNumber: text("id_number"),
    idStatus: checkStatusEnum("id_status").notNull().default("not_started"),
    /** The verification provider's reference for the running or last ID check. */
    idCheckReference: text("id_check_reference"),
    bankName: text("bank_name"),
    /** AES-256-GCM ciphertext from lib/crypto. */
    accountNumber: text("account_number"),
    accountHolder: text("account_holder"),
    bankStatus: checkStatusEnum("bank_status").notNull().default("not_started"),
  },
  (t) => [readOwn("seller_verification", t.sellerId)],
);

export const paymentMethodSettings = rlsTable(
  "payment_method_settings",
  {
    sellerId: uuid("seller_id")
      .notNull()
      .references(() => sellers.id, { onDelete: "cascade" }),
    method: paymentMethodEnum("method").notNull(),
    enabled: boolean("enabled").notNull().default(true),
  },
  (t) => [
    primaryKey({ columns: [t.sellerId, t.method] }),
    readOwn("payment_method_settings", t.sellerId),
  ],
);

export const items = rlsTable(
  "items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sellerId: uuid("seller_id")
      .notNull()
      .references(() => sellers.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    priceCents: integer("price_cents").notNull(),
    options: jsonb("options")
      .notNull()
      .default(sql`'[]'::jsonb`),
    imageUrl: text("image_url"),
    active: boolean("active").notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [
    index("items_seller_idx").on(t.sellerId),
    check("items_price_positive", sql`${t.priceCents} > 0`),
    readOwn("items", t.sellerId),
  ],
);

export const paymentRequests = rlsTable(
  "payment_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sellerId: uuid("seller_id")
      .notNull()
      .references(() => sellers.id, { onDelete: "cascade" }),
    amountCents: integer("amount_cents").notNull(),
    description: text("description"),
    status: requestStatusEnum("status").notNull().default("open"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    index("payment_requests_seller_idx").on(t.sellerId),
    check("payment_requests_amount_positive", sql`${t.amountCents} > 0`),
    readOwn("payment_requests", t.sellerId),
  ],
);

// ---- orders ----------------------------------------------------------------

/**
 * An order a buyer places from a seller's pay page. Amounts are always worked out on the server from
 * the seller's own items and delivery settings; nothing a browser sends is trusted. Sellers can read
 * their own orders. A buyer opens an order only through its unguessable access_token link, served by
 * server code, so there is no policy for anyone else.
 */
export const orders = rlsTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** The number shown as #OL-10458. */
    number: bigint("number", { mode: "number" }).generatedAlwaysAsIdentity({ startWith: 10001 }),
    sellerId: uuid("seller_id")
      .notNull()
      .references(() => sellers.id),
    /** In the buyer's link: /{handle}/orders/{accessToken}. */
    accessToken: text("access_token").notNull(),
    /** Made by the checkout form once, so a double submit returns the same order. */
    clientKey: text("client_key").notNull(),
    buyerName: text("buyer_name").notNull(),
    /** E.164 */
    buyerPhone: text("buyer_phone").notNull(),
    /** "delivery" or "collection" */
    method: text("method").notNull(),
    street: text("street"),
    suburb: text("suburb"),
    deliveryDate: text("delivery_date").notNull(),
    deliverySlot: text("delivery_slot").notNull(),
    subtotalCents: integer("subtotal_cents").notNull(),
    deliveryFeeCents: integer("delivery_fee_cents").notNull(),
    totalCents: integer("total_cents").notNull(),
    status: orderStatusEnum("status").notNull().default("placed"),
    paymentId: uuid("payment_id").references((): AnyPgColumn => payments.id),
    placedAt: timestamp("placed_at", { withTimezone: true }).notNull().defaultNow(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("orders_number_unique").on(t.number),
    uniqueIndex("orders_access_token_unique").on(t.accessToken),
    uniqueIndex("orders_client_key_unique").on(t.sellerId, t.clientKey),
    uniqueIndex("orders_payment_unique").on(t.paymentId),
    index("orders_seller_idx").on(t.sellerId),
    check("orders_method_valid", sql`${t.method} in ('delivery', 'collection')`),
    check(
      "orders_amounts_valid",
      sql`${t.subtotalCents} > 0 and ${t.deliveryFeeCents} >= 0 and ${t.totalCents} = ${t.subtotalCents} + ${t.deliveryFeeCents}`,
    ),
    readOwn("orders", t.sellerId),
  ],
);

export const orderLines = rlsTable(
  "order_lines",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    /** Kept when the item is later deleted, so the order still reads correctly. */
    itemId: uuid("item_id").references(() => items.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    /** [{ "name": "Length", "value": "14\"" }] */
    options: jsonb("options")
      .notNull()
      .default(sql`'[]'::jsonb`),
    quantity: integer("quantity").notNull(),
    unitPriceCents: integer("unit_price_cents").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    index("order_lines_order_idx").on(t.orderId),
    check("order_lines_valid", sql`${t.quantity} > 0 and ${t.unitPriceCents} > 0`),
    pgPolicy("order_lines_select_own", {
      for: "select",
      to: authenticatedRole,
      using: sql`${t.orderId} in (select o.id from orders o where o.seller_id in (select id from sellers where user_id = ${authUid}))`,
    }),
  ],
);

// ---- money -----------------------------------------------------------------

export const payments = rlsTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sellerId: uuid("seller_id")
      .notNull()
      .references(() => sellers.id),
    source: paymentSourceEnum("source").notNull(),
    /** Set when the payment is for a payment request. */
    requestId: uuid("request_id").references(() => paymentRequests.id),
    /** Set when the buyer picked one of the seller's items. */
    itemId: uuid("item_id").references(() => items.id),
    /** The item's name at the time, so a later rename or price change does not rewrite history. */
    itemName: text("item_name"),
    amountCents: integer("amount_cents").notNull(),
    feeCents: integer("fee_cents").notNull(),
    method: paymentMethodEnum("method").notNull(),
    status: paymentStatusEnum("status").notNull().default("pending"),
    buyerName: text("buyer_name"),
    buyerPhone: text("buyer_phone"),
    providerReference: text("provider_reference"),
    /** Every payment carries one. Retrying with the same key must not create a second payment. */
    idempotencyKey: text("idempotency_key").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("payments_idempotency_key_unique").on(t.idempotencyKey),
    index("payments_seller_idx").on(t.sellerId),
    index("payments_provider_reference_idx").on(t.providerReference),
    check("payments_amount_positive", sql`${t.amountCents} > 0`),
    check("payments_fee_valid", sql`${t.feeCents} >= 0 and ${t.feeCents} <= ${t.amountCents}`),
    readOwn("payments", t.sellerId),
  ],
);

export const payouts = rlsTable(
  "payouts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sellerId: uuid("seller_id")
      .notNull()
      .references(() => sellers.id),
    paymentId: uuid("payment_id")
      .notNull()
      .references(() => payments.id),
    amountCents: integer("amount_cents").notNull(),
    status: payoutStatusEnum("status").notNull().default("pending"),
    providerReference: text("provider_reference"),
    /** Every payout carries one. */
    idempotencyKey: text("idempotency_key").notNull(),
    landedAt: timestamp("landed_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("payouts_idempotency_key_unique").on(t.idempotencyKey),
    index("payouts_seller_idx").on(t.sellerId),
    check("payouts_amount_positive", sql`${t.amountCents} > 0`),
    readOwn("payouts", t.sellerId),
  ],
);

// ---- ledger (double entry) -------------------------------------------------

export const ledgerAccounts = rlsTable(
  "ledger_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Null for Ollo's own accounts (fee income, Stitch clearing). */
    sellerId: uuid("seller_id").references(() => sellers.id),
    type: ledgerAccountTypeEnum("type").notNull(),
    name: text("name").notNull(),
    currency: text("currency").notNull().default("ZAR"),
    createdAt: createdAt(),
  },
  (t) => [
    index("ledger_accounts_seller_idx").on(t.sellerId),
    // Postgres treats nulls as distinct, so coalesce makes (seller or Ollo, name) unique.
    uniqueIndex("ledger_accounts_owner_name_unique").on(
      sql`coalesce(${t.sellerId}, '00000000-0000-0000-0000-000000000000'::uuid)`,
      t.name,
    ),
    readOwn("ledger_accounts", t.sellerId),
  ],
);

/**
 * Signed amounts: debit is positive, credit is negative.
 * Entries that share a transaction_id must sum to zero. This is enforced in
 * /lib/ledger and again by a deferred constraint trigger (see migrations).
 */
export const ledgerEntries = rlsTable(
  "ledger_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    transactionId: uuid("transaction_id").notNull(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => ledgerAccounts.id),
    amountCents: bigint("amount_cents", { mode: "number" }).notNull(),
    paymentId: uuid("payment_id").references(() => payments.id),
    payoutId: uuid("payout_id").references(() => payouts.id),
    memo: text("memo"),
    createdAt: createdAt(),
  },
  (t) => [
    index("ledger_entries_transaction_idx").on(t.transactionId),
    index("ledger_entries_account_idx").on(t.accountId),
    check("ledger_entries_nonzero", sql`${t.amountCents} <> 0`),
    pgPolicy("ledger_entries_select_own", {
      for: "select",
      to: authenticatedRole,
      using: sql`${t.accountId} in (select id from ledger_accounts where seller_id in (select id from sellers where user_id = ${authUid}))`,
    }),
  ],
);

// ---- audit -----------------------------------------------------------------

export const auditLog = rlsTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** auth user id, or null for system actions. */
  actor: uuid("actor"),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id"),
  before: jsonb("before"),
  after: jsonb("after"),
  createdAt: createdAt(),
});

// ---- pre-launch sign-ups ----------------------------------------------------

/** People who asked to be told when Ollo launches (shown while PAYMENTS_LIVE is off). */
export const waitlistSignups = rlsTable(
  "waitlist_signups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** E.164, for example +27824567890. */
    phone: text("phone").notNull(),
    name: text("name"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("waitlist_signups_phone_unique").on(t.phone)],
);

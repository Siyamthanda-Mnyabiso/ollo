CREATE TYPE "public"."check_status" AS ENUM('not_started', 'checking', 'verified', 'failed');--> statement-breakpoint
CREATE TYPE "public"."ledger_account_type" AS ENUM('asset', 'liability', 'revenue', 'clearing');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('payshap', 'capitec_pay', 'instant_eft', 'card');--> statement-breakpoint
CREATE TYPE "public"."payment_source" AS ENUM('pay_link', 'request', 'item');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'succeeded', 'failed', 'expired', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."payout_status" AS ENUM('pending', 'processing', 'paid', 'failed');--> statement-breakpoint
CREATE TYPE "public"."plan" AS ENUM('free', 'pro');--> statement-breakpoint
CREATE TYPE "public"."request_status" AS ENUM('open', 'paid', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."monthly_sales_range" AS ENUM('under_5k', '5k_20k', '20k_50k', 'over_50k');--> statement-breakpoint
CREATE TYPE "public"."seller_status" AS ENUM('pending', 'verified', 'suspended');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor" uuid,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text,
	"before" jsonb,
	"after" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_log" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_id" uuid NOT NULL,
	"name" text NOT NULL,
	"price_cents" integer NOT NULL,
	"options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"image_url" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "items_price_positive" CHECK ("items"."price_cents" > 0)
);
--> statement-breakpoint
ALTER TABLE "items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "ledger_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_id" uuid,
	"type" "ledger_account_type" NOT NULL,
	"name" text NOT NULL,
	"currency" text DEFAULT 'ZAR' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ledger_accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "ledger_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"amount_cents" bigint NOT NULL,
	"payment_id" uuid,
	"payout_id" uuid,
	"memo" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ledger_entries_nonzero" CHECK ("ledger_entries"."amount_cents" <> 0)
);
--> statement-breakpoint
ALTER TABLE "ledger_entries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "payment_method_settings" (
	"seller_id" uuid NOT NULL,
	"method" "payment_method" NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	CONSTRAINT "payment_method_settings_seller_id_method_pk" PRIMARY KEY("seller_id","method")
);
--> statement-breakpoint
ALTER TABLE "payment_method_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "payment_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_id" uuid NOT NULL,
	"amount_cents" integer NOT NULL,
	"description" text,
	"status" "request_status" DEFAULT 'open' NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_requests_amount_positive" CHECK ("payment_requests"."amount_cents" > 0)
);
--> statement-breakpoint
ALTER TABLE "payment_requests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_id" uuid NOT NULL,
	"source" "payment_source" NOT NULL,
	"amount_cents" integer NOT NULL,
	"fee_cents" integer NOT NULL,
	"method" "payment_method" NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"buyer_name" text,
	"buyer_phone" text,
	"provider_reference" text,
	"idempotency_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_amount_positive" CHECK ("payments"."amount_cents" > 0),
	CONSTRAINT "payments_fee_valid" CHECK ("payments"."fee_cents" >= 0 and "payments"."fee_cents" <= "payments"."amount_cents")
);
--> statement-breakpoint
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_id" uuid NOT NULL,
	"payment_id" uuid NOT NULL,
	"amount_cents" integer NOT NULL,
	"status" "payout_status" DEFAULT 'pending' NOT NULL,
	"provider_reference" text,
	"idempotency_key" text NOT NULL,
	"landed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payouts_amount_positive" CHECK ("payouts"."amount_cents" > 0)
);
--> statement-breakpoint
ALTER TABLE "payouts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "seller_survey" (
	"seller_id" uuid PRIMARY KEY NOT NULL,
	"channels" text[] DEFAULT '{}'::text[] NOT NULL,
	"monthly_sales_range" "monthly_sales_range",
	"current_payment_methods" text[] DEFAULT '{}'::text[] NOT NULL
);
--> statement-breakpoint
ALTER TABLE "seller_survey" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "seller_verification" (
	"seller_id" uuid PRIMARY KEY NOT NULL,
	"id_number" text,
	"id_status" "check_status" DEFAULT 'not_started' NOT NULL,
	"bank_name" text,
	"account_number" text,
	"account_holder" text,
	"bank_status" "check_status" DEFAULT 'not_started' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "seller_verification" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "sellers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"display_name" text NOT NULL,
	"handle" text NOT NULL,
	"category" text NOT NULL,
	"bio" text,
	"logo_url" text,
	"plan" "plan" DEFAULT 'free' NOT NULL,
	"status" "seller_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sellers_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "sellers_handle_format" CHECK ("sellers"."handle" ~ '^[a-z0-9][a-z0-9-]{1,29}$')
);
--> statement-breakpoint
ALTER TABLE "sellers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_accounts" ADD CONSTRAINT "ledger_accounts_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_account_id_ledger_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."ledger_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_payout_id_payouts_id_fk" FOREIGN KEY ("payout_id") REFERENCES "public"."payouts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_method_settings" ADD CONSTRAINT "payment_method_settings_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_requests" ADD CONSTRAINT "payment_requests_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_survey" ADD CONSTRAINT "seller_survey_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_verification" ADD CONSTRAINT "seller_verification_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "items_seller_idx" ON "items" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "ledger_accounts_seller_idx" ON "ledger_accounts" USING btree ("seller_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ledger_accounts_owner_name_unique" ON "ledger_accounts" USING btree (coalesce("seller_id", '00000000-0000-0000-0000-000000000000'::uuid),"name");--> statement-breakpoint
CREATE INDEX "ledger_entries_transaction_idx" ON "ledger_entries" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "ledger_entries_account_idx" ON "ledger_entries" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "payment_requests_seller_idx" ON "payment_requests" USING btree ("seller_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_idempotency_key_unique" ON "payments" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "payments_seller_idx" ON "payments" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "payments_provider_reference_idx" ON "payments" USING btree ("provider_reference");--> statement-breakpoint
CREATE UNIQUE INDEX "payouts_idempotency_key_unique" ON "payouts" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "payouts_seller_idx" ON "payouts" USING btree ("seller_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sellers_handle_unique" ON "sellers" USING btree ("handle");--> statement-breakpoint
CREATE POLICY "items_select_own" ON "items" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("items"."seller_id" in (select id from sellers where user_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "ledger_accounts_select_own" ON "ledger_accounts" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("ledger_accounts"."seller_id" in (select id from sellers where user_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "ledger_entries_select_own" ON "ledger_entries" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("ledger_entries"."account_id" in (select id from ledger_accounts where seller_id in (select id from sellers where user_id = (select auth.uid()))));--> statement-breakpoint
CREATE POLICY "payment_method_settings_select_own" ON "payment_method_settings" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("payment_method_settings"."seller_id" in (select id from sellers where user_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "payment_requests_select_own" ON "payment_requests" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("payment_requests"."seller_id" in (select id from sellers where user_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "payments_select_own" ON "payments" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("payments"."seller_id" in (select id from sellers where user_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "payouts_select_own" ON "payouts" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("payouts"."seller_id" in (select id from sellers where user_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "seller_survey_select_own" ON "seller_survey" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("seller_survey"."seller_id" in (select id from sellers where user_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "seller_verification_select_own" ON "seller_verification" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("seller_verification"."seller_id" in (select id from sellers where user_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "sellers_select_own" ON "sellers" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("sellers"."user_id" = (select auth.uid()));
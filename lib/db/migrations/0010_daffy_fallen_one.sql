CREATE TYPE "public"."order_status" AS ENUM('placed', 'paid', 'sent', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TABLE "order_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"item_id" uuid,
	"name" text NOT NULL,
	"options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price_cents" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_lines_valid" CHECK ("order_lines"."quantity" > 0 and "order_lines"."unit_price_cents" > 0)
);
--> statement-breakpoint
ALTER TABLE "order_lines" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" bigint GENERATED ALWAYS AS IDENTITY (sequence name "orders_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 10001 CACHE 1),
	"seller_id" uuid NOT NULL,
	"access_token" text NOT NULL,
	"client_key" text NOT NULL,
	"buyer_name" text NOT NULL,
	"buyer_phone" text NOT NULL,
	"method" text NOT NULL,
	"street" text,
	"suburb" text,
	"delivery_date" text NOT NULL,
	"delivery_slot" text NOT NULL,
	"subtotal_cents" integer NOT NULL,
	"delivery_fee_cents" integer NOT NULL,
	"total_cents" integer NOT NULL,
	"status" "order_status" DEFAULT 'placed' NOT NULL,
	"payment_id" uuid,
	"placed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paid_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_method_valid" CHECK ("orders"."method" in ('delivery', 'collection')),
	CONSTRAINT "orders_amounts_valid" CHECK ("orders"."subtotal_cents" > 0 and "orders"."delivery_fee_cents" >= 0 and "orders"."total_cents" = "orders"."subtotal_cents" + "orders"."delivery_fee_cents")
);
--> statement-breakpoint
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "sellers" ADD COLUMN "fulfilment" text DEFAULT 'both' NOT NULL;--> statement-breakpoint
ALTER TABLE "sellers" ADD COLUMN "collection_address" text;--> statement-breakpoint
ALTER TABLE "sellers" ADD COLUMN "delivery_fee_cents" integer;--> statement-breakpoint
ALTER TABLE "sellers" ADD COLUMN "delivery_days" integer[] DEFAULT '{}'::integer[] NOT NULL;--> statement-breakpoint
ALTER TABLE "sellers" ADD COLUMN "delivery_slots" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "order_lines_order_idx" ON "order_lines" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_number_unique" ON "orders" USING btree ("number");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_access_token_unique" ON "orders" USING btree ("access_token");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_client_key_unique" ON "orders" USING btree ("seller_id","client_key");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_payment_unique" ON "orders" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "orders_seller_idx" ON "orders" USING btree ("seller_id");--> statement-breakpoint
ALTER TABLE "sellers" ADD CONSTRAINT "sellers_fulfilment_valid" CHECK ("sellers"."fulfilment" in ('delivery', 'collection', 'both') and ("sellers"."delivery_fee_cents" is null or "sellers"."delivery_fee_cents" >= 0));--> statement-breakpoint
CREATE POLICY "order_lines_select_own" ON "order_lines" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("order_lines"."order_id" in (select o.id from orders o where o.seller_id in (select id from sellers where user_id = (select auth.uid()))));--> statement-breakpoint
CREATE POLICY "orders_select_own" ON "orders" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("orders"."seller_id" in (select id from sellers where user_id = (select auth.uid())));
ALTER TABLE "payments" ADD COLUMN "item_id" uuid;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "item_name" text;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;
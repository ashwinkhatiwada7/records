CREATE TYPE "entry_type" AS ENUM('in', 'out');--> statement-breakpoint
CREATE TYPE "page_status" AS ENUM('open', 'closed');--> statement-breakpoint
CREATE TABLE "customer" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"phone" text,
	"note" text,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entry" (
	"id" text PRIMARY KEY,
	"ledger_page_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"type" "entry_type" NOT NULL,
	"amount_cents" integer NOT NULL,
	"payment_method_id" text NOT NULL,
	"game_id" text,
	"note" text,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "entry_amount_positive" CHECK ("amount_cents" > 0)
);
--> statement-breakpoint
CREATE TABLE "expense" (
	"id" text PRIMARY KEY,
	"ledger_page_id" text NOT NULL,
	"description" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"payment_method_id" text,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "expense_amount_positive" CHECK ("amount_cents" > 0)
);
--> statement-breakpoint
CREATE TABLE "game" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL UNIQUE,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger_page" (
	"id" text PRIMARY KEY,
	"title" text NOT NULL,
	"status" "page_status" DEFAULT 'open'::"page_status" NOT NULL,
	"note" text,
	"opened_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp,
	"closed_by" text,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_method" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL UNIQUE,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "customer_name_idx" ON "customer" ("name");--> statement-breakpoint
CREATE INDEX "entry_page_idx" ON "entry" ("ledger_page_id","created_at");--> statement-breakpoint
CREATE INDEX "entry_customer_idx" ON "entry" ("customer_id");--> statement-breakpoint
CREATE INDEX "entry_game_idx" ON "entry" ("game_id");--> statement-breakpoint
CREATE INDEX "expense_page_idx" ON "expense" ("ledger_page_id");--> statement-breakpoint
CREATE INDEX "ledger_page_status_idx" ON "ledger_page" ("status","opened_at");--> statement-breakpoint
ALTER TABLE "customer" ADD CONSTRAINT "customer_created_by_user_id_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "entry" ADD CONSTRAINT "entry_ledger_page_id_ledger_page_id_fkey" FOREIGN KEY ("ledger_page_id") REFERENCES "ledger_page"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "entry" ADD CONSTRAINT "entry_customer_id_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "entry" ADD CONSTRAINT "entry_payment_method_id_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_method"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "entry" ADD CONSTRAINT "entry_game_id_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "game"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "entry" ADD CONSTRAINT "entry_created_by_user_id_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_ledger_page_id_ledger_page_id_fkey" FOREIGN KEY ("ledger_page_id") REFERENCES "ledger_page"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_payment_method_id_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_method"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_created_by_user_id_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "game" ADD CONSTRAINT "game_created_by_user_id_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "ledger_page" ADD CONSTRAINT "ledger_page_closed_by_user_id_fkey" FOREIGN KEY ("closed_by") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "ledger_page" ADD CONSTRAINT "ledger_page_created_by_user_id_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "payment_method" ADD CONSTRAINT "payment_method_created_by_user_id_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE RESTRICT;
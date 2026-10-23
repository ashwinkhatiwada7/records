CREATE TABLE "entry_game" (
	"entry_id" text,
	"game_id" text,
	CONSTRAINT "entry_game_pkey" PRIMARY KEY("entry_id","game_id")
);
--> statement-breakpoint
ALTER TABLE "entry" DROP CONSTRAINT "entry_game_id_game_id_fkey";--> statement-breakpoint
DROP INDEX "entry_game_idx";--> statement-breakpoint
ALTER TABLE "customer" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "customer" ADD COLUMN "profile_url" text;--> statement-breakpoint
ALTER TABLE "customer" DROP COLUMN "note";--> statement-breakpoint
ALTER TABLE "entry" DROP COLUMN "game_id";--> statement-breakpoint
ALTER TABLE "entry" DROP COLUMN "note";--> statement-breakpoint
ALTER TABLE "ledger_page" DROP COLUMN "note";--> statement-breakpoint
CREATE INDEX "entry_game_game_idx" ON "entry_game" ("game_id");--> statement-breakpoint
ALTER TABLE "entry_game" ADD CONSTRAINT "entry_game_entry_id_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "entry"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "entry_game" ADD CONSTRAINT "entry_game_game_id_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "game"("id") ON DELETE RESTRICT;
ALTER TABLE "questions" ADD COLUMN "options" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" DROP COLUMN "option_a";--> statement-breakpoint
ALTER TABLE "questions" DROP COLUMN "option_b";--> statement-breakpoint
ALTER TABLE "questions" DROP COLUMN "option_c";
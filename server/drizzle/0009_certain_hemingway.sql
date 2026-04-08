ALTER TABLE "user_purchases" ALTER COLUMN "access_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."access_type";--> statement-breakpoint
CREATE TYPE "public"."access_type" AS ENUM('free_trial', 'day_pass', 'week_pass');--> statement-breakpoint
ALTER TABLE "user_purchases" ALTER COLUMN "access_type" SET DATA TYPE "public"."access_type" USING "access_type"::"public"."access_type";
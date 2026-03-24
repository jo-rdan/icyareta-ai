ALTER TABLE "user_purchases" ALTER COLUMN "access_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."access_type";--> statement-breakpoint
CREATE TYPE "public"."access_type" AS ENUM('free_trial', 'day_pass');--> statement-breakpoint
ALTER TABLE "user_purchases" ALTER COLUMN "access_type" SET DATA TYPE "public"."access_type" USING "access_type"::"public"."access_type";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");
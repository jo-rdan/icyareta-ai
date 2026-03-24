CREATE TYPE "public"."access_type" AS ENUM('free_trial', 'daily', 'weekly');--> statement-breakpoint
ALTER TABLE "exam_results" RENAME COLUMN "pack_id" TO "subject_id";--> statement-breakpoint
ALTER TABLE "exam_results" DROP CONSTRAINT "exam_results_pack_id_exam_packs_id_fk";
--> statement-breakpoint
ALTER TABLE "user_purchases" DROP CONSTRAINT "user_purchases_pack_id_exam_packs_id_fk";
--> statement-breakpoint
ALTER TABLE "exam_results" ADD COLUMN "pack_type" "pack_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "user_purchases" ADD COLUMN "access_type" "access_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "user_purchases" ADD COLUMN "amount_paid" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "has_used_free_trial" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_purchases" DROP COLUMN "pack_id";--> statement-breakpoint
ALTER TABLE "user_purchases" DROP COLUMN "is_bundle";--> statement-breakpoint
ALTER TABLE "user_purchases" DROP COLUMN "bundle_price";
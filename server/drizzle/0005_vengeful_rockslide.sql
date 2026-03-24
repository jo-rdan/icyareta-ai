ALTER TABLE "exam_packs" ALTER COLUMN "subject_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_purchases" ADD COLUMN "is_bundle" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_purchases" ADD COLUMN "bundle_price" integer;--> statement-breakpoint
ALTER TABLE "exam_packs" DROP COLUMN "is_bundle";
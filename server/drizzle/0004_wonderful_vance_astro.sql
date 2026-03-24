ALTER TABLE "exam_packs" ALTER COLUMN "subject_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "exam_packs" ADD COLUMN "is_bundle" boolean DEFAULT false NOT NULL;
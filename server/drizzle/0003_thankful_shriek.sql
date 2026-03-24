CREATE TYPE "public"."session_status" AS ENUM('in_progress', 'completed', 'abandoned');--> statement-breakpoint
ALTER TABLE "session_logs" ADD COLUMN "selected_subject_id" uuid;--> statement-breakpoint
ALTER TABLE "session_logs" ADD COLUMN "selected_pack_id" uuid;--> statement-breakpoint
ALTER TABLE "session_logs" ADD COLUMN "current_question_index" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "session_logs" ADD COLUMN "assigned_question_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "session_logs" ADD COLUMN "answers" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "session_logs" ADD COLUMN "status" "session_status" DEFAULT 'in_progress' NOT NULL;--> statement-breakpoint
ALTER TABLE "session_logs" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "user_purchases" ADD COLUMN "transaction_reference" text;--> statement-breakpoint
ALTER TABLE "user_purchases" ADD COLUMN "expires_at" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "session_logs" ADD CONSTRAINT "session_logs_selected_subject_id_subjects_id_fk" FOREIGN KEY ("selected_subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_logs" ADD CONSTRAINT "session_logs_selected_pack_id_exam_packs_id_fk" FOREIGN KEY ("selected_pack_id") REFERENCES "public"."exam_packs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_logs" ADD CONSTRAINT "session_logs_sessionId_unique" UNIQUE("session_id");
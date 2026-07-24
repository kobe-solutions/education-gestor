CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid,
	"user_id" text NOT NULL,
	"user_role" text NOT NULL,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text NOT NULL,
	"payload" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;
--> statement-breakpoint
ALTER TABLE "teachers" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;
--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;
--> statement-breakpoint
ALTER TABLE "guardians" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "att_class_date_idx" ON "attendances" USING btree ("class_id","date");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "att_student_idx" ON "attendances" USING btree ("student_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "grades_student_period_idx" ON "grades" USING btree ("student_id","academic_period_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "grades_class_idx" ON "grades" USING btree ("class_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "grades_unique_idx" ON "grades" USING btree ("school_id","class_id","student_id","subject_id","academic_period_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tuitions_school_status_idx" ON "tuitions" USING btree ("school_id","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tuitions_due_date_idx" ON "tuitions" USING btree ("due_date");

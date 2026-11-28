ALTER TABLE "schools" ADD COLUMN "min_passing_grade" real DEFAULT 6 NOT NULL;--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN "min_attendance_percentage" integer DEFAULT 75 NOT NULL;--> statement-breakpoint
ALTER TABLE "teachers" ADD COLUMN "available_days" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "teachers" ADD COLUMN "available_shifts" jsonb DEFAULT '[]'::jsonb NOT NULL;
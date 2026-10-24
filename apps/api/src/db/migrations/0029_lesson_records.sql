CREATE TABLE "lesson_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"teacher_id" uuid NOT NULL,
	"class_id" uuid NOT NULL,
	"subject_id" uuid NOT NULL,
	"date" date NOT NULL,
	"title" text NOT NULL,
	"topic" text NOT NULL,
	"description" text,
	"attachments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lesson_records" ADD CONSTRAINT "lesson_records_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "lesson_records" ADD CONSTRAINT "lesson_records_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "lesson_records" ADD CONSTRAINT "lesson_records_class_id_schoolClasses_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."schoolClasses"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "lesson_records" ADD CONSTRAINT "lesson_records_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "lesson_records_school_date_idx" ON "lesson_records" USING btree ("school_id", "date");
--> statement-breakpoint
CREATE INDEX "lesson_records_teacher_date_idx" ON "lesson_records" USING btree ("teacher_id", "date");

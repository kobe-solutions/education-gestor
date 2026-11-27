CREATE TABLE "assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"class_id" uuid NOT NULL,
	"subject_id" uuid NOT NULL,
	"academic_period_id" uuid NOT NULL,
	"teacher_id" uuid NOT NULL,
	"name" text NOT NULL,
	"weight" numeric(5, 2) DEFAULT '1.00' NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "assessments_weight_check" CHECK ("assessments"."weight" > 0)
);
--> statement-breakpoint
CREATE TABLE "period_grade_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"class_id" uuid NOT NULL,
	"subject_id" uuid NOT NULL,
	"academic_period_id" uuid NOT NULL,
	"calculation_method" text DEFAULT 'simple' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "period_grade_configs_method_check" CHECK ("period_grade_configs"."calculation_method" IN ('simple', 'weighted'))
);
--> statement-breakpoint
DROP INDEX "grades_unique_idx";--> statement-breakpoint
ALTER TABLE "grades" ADD COLUMN "assessment_id" uuid;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_class_id_schoolClasses_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."schoolClasses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_academic_period_id_academic_periods_id_fk" FOREIGN KEY ("academic_period_id") REFERENCES "public"."academic_periods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "period_grade_configs" ADD CONSTRAINT "period_grade_configs_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "period_grade_configs" ADD CONSTRAINT "period_grade_configs_class_id_schoolClasses_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."schoolClasses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "period_grade_configs" ADD CONSTRAINT "period_grade_configs_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "period_grade_configs" ADD CONSTRAINT "period_grade_configs_academic_period_id_academic_periods_id_fk" FOREIGN KEY ("academic_period_id") REFERENCES "public"."academic_periods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assessments_scope_idx" ON "assessments" USING btree ("school_id","class_id","subject_id","academic_period_id");--> statement-breakpoint
CREATE UNIQUE INDEX "period_grade_configs_unique_idx" ON "period_grade_configs" USING btree ("school_id","class_id","subject_id","academic_period_id");--> statement-breakpoint
ALTER TABLE "grades" ADD CONSTRAINT "grades_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "grades_assessment_idx" ON "grades" USING btree ("assessment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "grades_assessment_unique_idx" ON "grades" USING btree ("school_id","student_id","assessment_id") WHERE "grades"."assessment_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "grades_legacy_unique_idx" ON "grades" USING btree ("school_id","class_id","student_id","subject_id","academic_period_id") WHERE "grades"."assessment_id" IS NULL;
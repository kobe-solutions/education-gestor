CREATE TABLE "audit_logs" (
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
CREATE TABLE "student_medical" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"allergies" text,
	"medications" text,
	"food_restrictions" text,
	"diseases" text,
	"medical_contact" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "student_medical_student_id_unique" UNIQUE("student_id")
);
--> statement-breakpoint
CREATE TABLE "student_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"file_url" text NOT NULL,
	"file_size" integer,
	"mime_type" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "class_teachers" RENAME TO "timetable_slots";--> statement-breakpoint
ALTER TABLE "timetable_slots" DROP CONSTRAINT "class_teachers_class_id_schoolClasses_id_fk";
--> statement-breakpoint
ALTER TABLE "timetable_slots" DROP CONSTRAINT "class_teachers_teacher_id_teachers_id_fk";
--> statement-breakpoint
DROP INDEX "class_teachers_unique";--> statement-breakpoint
ALTER TABLE "grades" ADD COLUMN "subject_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "grades" ADD COLUMN "academic_period_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "timetable_slots" ADD COLUMN "school_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "timetable_slots" ADD COLUMN "academic_period_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "timetable_slots" ADD COLUMN "subject_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "timetable_slots" ADD COLUMN "week_day" text NOT NULL;--> statement-breakpoint
ALTER TABLE "timetable_slots" ADD COLUMN "start_time" text NOT NULL;--> statement-breakpoint
ALTER TABLE "timetable_slots" ADD COLUMN "end_time" text NOT NULL;--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "teachers" ADD COLUMN "cpf" text;--> statement-breakpoint
ALTER TABLE "teachers" ADD COLUMN "rg" text;--> statement-breakpoint
ALTER TABLE "teachers" ADD COLUMN "birth_date" date;--> statement-breakpoint
ALTER TABLE "teachers" ADD COLUMN "sex" text;--> statement-breakpoint
ALTER TABLE "teachers" ADD COLUMN "nationality" text;--> statement-breakpoint
ALTER TABLE "teachers" ADD COLUMN "marital_status" text;--> statement-breakpoint
ALTER TABLE "teachers" ADD COLUMN "photo_url" text;--> statement-breakpoint
ALTER TABLE "teachers" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "teachers" ADD COLUMN "address_cep" text;--> statement-breakpoint
ALTER TABLE "teachers" ADD COLUMN "address_street" text;--> statement-breakpoint
ALTER TABLE "teachers" ADD COLUMN "address_number" text;--> statement-breakpoint
ALTER TABLE "teachers" ADD COLUMN "address_complement" text;--> statement-breakpoint
ALTER TABLE "teachers" ADD COLUMN "address_neighborhood" text;--> statement-breakpoint
ALTER TABLE "teachers" ADD COLUMN "address_city" text;--> statement-breakpoint
ALTER TABLE "teachers" ADD COLUMN "address_state" text;--> statement-breakpoint
ALTER TABLE "teachers" ADD COLUMN "position" text;--> statement-breakpoint
ALTER TABLE "teachers" ADD COLUMN "contract_type" text;--> statement-breakpoint
ALTER TABLE "teachers" ADD COLUMN "workload" text;--> statement-breakpoint
ALTER TABLE "teachers" ADD COLUMN "work_shift" text;--> statement-breakpoint
ALTER TABLE "teachers" ADD COLUMN "employment_status" text DEFAULT 'ativo' NOT NULL;--> statement-breakpoint
ALTER TABLE "teachers" ADD COLUMN "education_level" text;--> statement-breakpoint
ALTER TABLE "teachers" ADD COLUMN "degree" text;--> statement-breakpoint
ALTER TABLE "teachers" ADD COLUMN "institution" text;--> statement-breakpoint
ALTER TABLE "teachers" ADD COLUMN "professional_registry" text;--> statement-breakpoint
ALTER TABLE "teachers" ADD COLUMN "bank" text;--> statement-breakpoint
ALTER TABLE "teachers" ADD COLUMN "agency" text;--> statement-breakpoint
ALTER TABLE "teachers" ADD COLUMN "account_number" text;--> statement-breakpoint
ALTER TABLE "teachers" ADD COLUMN "account_type" text;--> statement-breakpoint
ALTER TABLE "teachers" ADD COLUMN "pix_key" text;--> statement-breakpoint
ALTER TABLE "teachers" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "guardians" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "guardians" ADD COLUMN "cpf" text;--> statement-breakpoint
ALTER TABLE "guardians" ADD COLUMN "profession" text;--> statement-breakpoint
ALTER TABLE "guardians" ADD COLUMN "is_responsible" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "guardians" ADD COLUMN "is_authorized_pickup" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "guardians" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "cpf" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "rg" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "sex" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "blood_type" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "naturalidade" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "photo_url" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "mother_name" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "father_name" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "mother_phone" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "address_cep" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "address_street" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "address_number" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "address_complement" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "address_neighborhood" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "address_city" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "address_state" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "comorbidities" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "observations" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "internal_code" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "enrollment_status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "enrollment_date" date;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "schoolClasses" ADD COLUMN "serie_id" uuid;--> statement-breakpoint
ALTER TABLE "schoolClasses" ADD COLUMN "academic_period_id" uuid;--> statement-breakpoint
ALTER TABLE "schoolClasses" ADD COLUMN "max_students" integer DEFAULT 40 NOT NULL;--> statement-breakpoint
ALTER TABLE "student_medical" ADD CONSTRAINT "student_medical_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_medical" ADD CONSTRAINT "student_medical_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_documents" ADD CONSTRAINT "student_documents_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_documents" ADD CONSTRAINT "student_documents_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grades" ADD CONSTRAINT "grades_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grades" ADD CONSTRAINT "grades_academic_period_id_academic_periods_id_fk" FOREIGN KEY ("academic_period_id") REFERENCES "public"."academic_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_class_id_schoolClasses_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."schoolClasses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_academic_period_id_academic_periods_id_fk" FOREIGN KEY ("academic_period_id") REFERENCES "public"."academic_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schoolClasses" ADD CONSTRAINT "schoolClasses_serie_id_series_id_fk" FOREIGN KEY ("serie_id") REFERENCES "public"."series"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schoolClasses" ADD CONSTRAINT "schoolClasses_academic_period_id_academic_periods_id_fk" FOREIGN KEY ("academic_period_id") REFERENCES "public"."academic_periods"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "att_class_date_idx" ON "attendances" USING btree ("class_id","date");--> statement-breakpoint
CREATE INDEX "att_student_idx" ON "attendances" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "grades_student_period_idx" ON "grades" USING btree ("student_id","academic_period_id");--> statement-breakpoint
CREATE INDEX "grades_class_idx" ON "grades" USING btree ("class_id");--> statement-breakpoint
CREATE UNIQUE INDEX "grades_unique_idx" ON "grades" USING btree ("school_id","class_id","student_id","subject_id","academic_period_id");--> statement-breakpoint
CREATE UNIQUE INDEX "timetable_teacher_slot_unique" ON "timetable_slots" USING btree ("teacher_id","week_day","start_time","academic_period_id");--> statement-breakpoint
CREATE INDEX "tuitions_school_status_idx" ON "tuitions" USING btree ("school_id","status");--> statement-breakpoint
CREATE INDEX "tuitions_due_date_idx" ON "tuitions" USING btree ("due_date");--> statement-breakpoint
ALTER TABLE "grades" DROP COLUMN "subject";--> statement-breakpoint
ALTER TABLE "grades" DROP COLUMN "period";--> statement-breakpoint
ALTER TABLE "schoolClasses" DROP COLUMN "grade";--> statement-breakpoint
ALTER TABLE "schoolClasses" DROP COLUMN "term_time";
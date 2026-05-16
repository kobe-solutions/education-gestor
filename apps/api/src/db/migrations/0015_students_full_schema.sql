-- Migration: adiciona colunas faltantes em students/guardians e cria tabelas novas

-- Colunas faltantes em students
ALTER TABLE "students"
  ADD COLUMN IF NOT EXISTS "cpf" text,
  ADD COLUMN IF NOT EXISTS "rg" text,
  ADD COLUMN IF NOT EXISTS "sex" text,
  ADD COLUMN IF NOT EXISTS "blood_type" text,
  ADD COLUMN IF NOT EXISTS "naturalidade" text,
  ADD COLUMN IF NOT EXISTS "photo_url" text,
  ADD COLUMN IF NOT EXISTS "phone" text,
  ADD COLUMN IF NOT EXISTS "mother_name" text,
  ADD COLUMN IF NOT EXISTS "father_name" text,
  ADD COLUMN IF NOT EXISTS "mother_phone" text,
  ADD COLUMN IF NOT EXISTS "address_cep" text,
  ADD COLUMN IF NOT EXISTS "address_street" text,
  ADD COLUMN IF NOT EXISTS "address_number" text,
  ADD COLUMN IF NOT EXISTS "address_complement" text,
  ADD COLUMN IF NOT EXISTS "address_neighborhood" text,
  ADD COLUMN IF NOT EXISTS "address_city" text,
  ADD COLUMN IF NOT EXISTS "address_state" text,
  ADD COLUMN IF NOT EXISTS "comorbidities" text,
  ADD COLUMN IF NOT EXISTS "observations" text,
  ADD COLUMN IF NOT EXISTS "internal_code" text,
  ADD COLUMN IF NOT EXISTS "enrollment_date" date;

-- enrollment_status precisa de DEFAULT separado pois é NOT NULL
ALTER TABLE "students"
  ADD COLUMN IF NOT EXISTS "enrollment_status" text NOT NULL DEFAULT 'active';

--> statement-breakpoint

-- Colunas faltantes em guardians
ALTER TABLE "guardians"
  ADD COLUMN IF NOT EXISTS "email" text,
  ADD COLUMN IF NOT EXISTS "cpf" text,
  ADD COLUMN IF NOT EXISTS "profession" text,
  ADD COLUMN IF NOT EXISTS "is_responsible" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "is_authorized_pickup" boolean NOT NULL DEFAULT false;

--> statement-breakpoint

-- Tabela student_medical
CREATE TABLE IF NOT EXISTS "student_medical" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "school_id" uuid NOT NULL,
  "student_id" uuid NOT NULL UNIQUE,
  "allergies" text,
  "medications" text,
  "food_restrictions" text,
  "diseases" text,
  "medical_contact" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint

ALTER TABLE "student_medical"
  ADD CONSTRAINT "student_medical_school_id_schools_id_fk"
    FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;

--> statement-breakpoint

ALTER TABLE "student_medical"
  ADD CONSTRAINT "student_medical_student_id_students_id_fk"
    FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint

-- Tabela student_documents
CREATE TABLE IF NOT EXISTS "student_documents" (
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

ALTER TABLE "student_documents"
  ADD CONSTRAINT "student_documents_school_id_schools_id_fk"
    FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;

--> statement-breakpoint

ALTER TABLE "student_documents"
  ADD CONSTRAINT "student_documents_student_id_students_id_fk"
    FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint

-- Tabela timetable_slots
CREATE TABLE IF NOT EXISTS "timetable_slots" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "school_id" uuid NOT NULL,
  "class_id" uuid NOT NULL,
  "academic_period_id" uuid NOT NULL,
  "subject_id" uuid NOT NULL,
  "teacher_id" uuid NOT NULL,
  "week_day" text NOT NULL,
  "start_time" text NOT NULL,
  "end_time" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint

ALTER TABLE "timetable_slots"
  ADD CONSTRAINT "timetable_slots_school_id_schools_id_fk"
    FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;

--> statement-breakpoint

ALTER TABLE "timetable_slots"
  ADD CONSTRAINT "timetable_slots_class_id_schoolClasses_id_fk"
    FOREIGN KEY ("class_id") REFERENCES "public"."schoolClasses"("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint

ALTER TABLE "timetable_slots"
  ADD CONSTRAINT "timetable_slots_academic_period_id_academic_periods_id_fk"
    FOREIGN KEY ("academic_period_id") REFERENCES "public"."academic_periods"("id") ON DELETE no action ON UPDATE no action;

--> statement-breakpoint

ALTER TABLE "timetable_slots"
  ADD CONSTRAINT "timetable_slots_subject_id_subjects_id_fk"
    FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;

--> statement-breakpoint

ALTER TABLE "timetable_slots"
  ADD CONSTRAINT "timetable_slots_teacher_id_teachers_id_fk"
    FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE no action ON UPDATE no action;

--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "timetable_teacher_slot_unique"
  ON "timetable_slots" ("teacher_id", "week_day", "start_time", "academic_period_id");

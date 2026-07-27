CREATE TABLE "teacher_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"teacher_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"file_url" text NOT NULL,
	"file_size" integer,
	"mime_type" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tuitions" ADD COLUMN "boleto_url" text;--> statement-breakpoint
ALTER TABLE "tuitions" ADD COLUMN "boleto_file_size" integer;--> statement-breakpoint
ALTER TABLE "tuitions" ADD COLUMN "receipt_url" text;--> statement-breakpoint
ALTER TABLE "tuitions" ADD COLUMN "receipt_file_size" integer;--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "secretarias" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "teacher_documents" ADD CONSTRAINT "teacher_documents_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_documents" ADD CONSTRAINT "teacher_documents_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;
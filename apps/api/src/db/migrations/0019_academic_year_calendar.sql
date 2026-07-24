CREATE TABLE "academic_years" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"name" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"registration_start" date,
	"registration_end" date,
	"status" text DEFAULT 'planning' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendar_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"academic_year_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"affects_attendance" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schoolClasses" DROP CONSTRAINT IF EXISTS "schoolClasses_academic_period_id_academic_periods_id_fk";
ALTER TABLE "schoolClasses" DROP CONSTRAINT IF EXISTS "schoolClasses_academic_period_id_fkey";
--> statement-breakpoint
ALTER TABLE "academic_periods" ADD COLUMN "academic_year_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "academic_periods" ADD COLUMN "type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "academic_periods" ADD COLUMN "order" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "academic_periods" ADD COLUMN "grade_closing_date" date;--> statement-breakpoint
ALTER TABLE "schoolClasses" ADD COLUMN "academic_year_id" uuid;--> statement-breakpoint
ALTER TABLE "academic_years" ADD CONSTRAINT "academic_years_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "academic_years_school_year_unique" ON "academic_years" USING btree ("school_id","year");--> statement-breakpoint
ALTER TABLE "academic_periods" ADD CONSTRAINT "academic_periods_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schoolClasses" ADD CONSTRAINT "schoolClasses_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_periods" DROP COLUMN "active";--> statement-breakpoint
ALTER TABLE "schoolClasses" DROP COLUMN "academic_period_id";
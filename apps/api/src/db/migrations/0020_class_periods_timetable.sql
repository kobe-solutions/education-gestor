CREATE TABLE "class_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"name" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"order" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "timetable_slots" DROP CONSTRAINT "timetable_slots_academic_period_id_academic_periods_id_fk";
--> statement-breakpoint
DROP INDEX "timetable_teacher_slot_unique";--> statement-breakpoint
ALTER TABLE "timetable_slots" ADD COLUMN "academic_year_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "timetable_slots" ADD COLUMN "class_period_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "class_periods" ADD CONSTRAINT "class_periods_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "class_periods_school_order_unique" ON "class_periods" USING btree ("school_id","order");--> statement-breakpoint
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_class_period_id_class_periods_id_fk" FOREIGN KEY ("class_period_id") REFERENCES "public"."class_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "timetable_teacher_slot_unique" ON "timetable_slots" USING btree ("teacher_id","week_day","class_period_id","academic_year_id");--> statement-breakpoint
ALTER TABLE "timetable_slots" DROP COLUMN "academic_period_id";--> statement-breakpoint
ALTER TABLE "timetable_slots" DROP COLUMN "start_time";--> statement-breakpoint
ALTER TABLE "timetable_slots" DROP COLUMN "end_time";
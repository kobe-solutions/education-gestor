ALTER TABLE "timetable_slots" DROP CONSTRAINT "timetable_slots_class_period_id_class_periods_id_fk";
--> statement-breakpoint
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_class_period_id_class_periods_id_fk" FOREIGN KEY ("class_period_id") REFERENCES "public"."class_periods"("id") ON DELETE cascade ON UPDATE no action;
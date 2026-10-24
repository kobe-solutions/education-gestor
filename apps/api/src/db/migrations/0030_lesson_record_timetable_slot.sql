ALTER TABLE "lesson_records" ADD COLUMN "timetable_slot_id" uuid;
--> statement-breakpoint
ALTER TABLE "lesson_records" ADD CONSTRAINT "lesson_records_timetable_slot_id_timetable_slots_id_fk" FOREIGN KEY ("timetable_slot_id") REFERENCES "public"."timetable_slots"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "lesson_records_timetable_slot_idx" ON "lesson_records" USING btree ("timetable_slot_id");

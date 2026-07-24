ALTER TABLE "classes" RENAME TO "schoolClasses";--> statement-breakpoint
ALTER TABLE "schoolClasses" DROP CONSTRAINT "classes_school_id_schools_id_fk";
--> statement-breakpoint
DROP INDEX "classes_school_email_unique";--> statement-breakpoint
ALTER TABLE "schoolClasses" ADD CONSTRAINT "schoolClasses_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "schoolClasses_school_email_unique" ON "schoolClasses" USING btree ("school_id","name");
import {
  pgTable,
  uuid,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { schools } from "./schools";

export const schoolClasses = pgTable(
  "schoolClasses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id),
    name: text("name").notNull(),
    grade: text("grade").notNull(),
    shift: text("shift").notNull(),
    termTime: text("term_time").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    schoolEmailUnique: uniqueIndex("schoolClasses_school_email_unique").on(
      table.schoolId,
      table.name,
    ),
  }),
);

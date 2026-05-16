import { pgTable, uuid, text, timestamp, uniqueIndex, integer } from 'drizzle-orm/pg-core'
import { schools } from './schools'
import { series } from './series'
import { academicPeriods } from './academicPeriods'

export const schoolClasses = pgTable(
  'schoolClasses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    schoolId: uuid('school_id')
      .notNull()
      .references(() => schools.id),
    serieId: uuid('serie_id').references(() => series.id, { onDelete: 'set null' }),
    academicPeriodId: uuid('academic_period_id').references(() => academicPeriods.id, {
      onDelete: 'set null',
    }),
    name: text('name').notNull(),
    shift: text('shift').notNull(),
    maxStudents: integer('max_students').notNull().default(40),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    schoolNameUnique: uniqueIndex('schoolClasses_school_email_unique').on(
      table.schoolId,
      table.name,
    ),
  }),
)

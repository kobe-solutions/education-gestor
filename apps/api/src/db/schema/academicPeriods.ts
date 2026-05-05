import { pgTable, uuid, text, timestamp, date, boolean } from 'drizzle-orm/pg-core'
import { schools } from './schools'

export const academicPeriods = pgTable('academic_periods', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: uuid('school_id')
    .notNull()
    .references(() => schools.id),
  name: text('name').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  active: boolean('active').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

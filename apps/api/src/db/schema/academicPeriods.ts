import { pgTable, uuid, text, timestamp, date, integer } from 'drizzle-orm/pg-core'
import { schools } from './schools'
import { academicYears } from './academicYears'

export const academicPeriods = pgTable('academic_periods', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: uuid('school_id')
    .notNull()
    .references(() => schools.id),
  academicYearId: uuid('academic_year_id')
    .notNull()
    .references(() => academicYears.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'bimestre' | 'trimestre' | 'semestre'
  order: integer('order').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  gradeClosingDate: date('grade_closing_date'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

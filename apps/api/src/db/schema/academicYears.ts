import { pgTable, uuid, text, timestamp, date, integer, uniqueIndex } from 'drizzle-orm/pg-core'
import { schools } from './schools'

export const academicYears = pgTable(
  'academic_years',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    schoolId: uuid('school_id')
      .notNull()
      .references(() => schools.id),
    year: integer('year').notNull(),
    name: text('name').notNull(),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    registrationStart: date('registration_start'),
    registrationEnd: date('registration_end'),
    status: text('status').notNull().default('planning'), // 'planning' | 'active' | 'closed'
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    schoolYearUnique: uniqueIndex('academic_years_school_year_unique').on(table.schoolId, table.year),
  }),
)

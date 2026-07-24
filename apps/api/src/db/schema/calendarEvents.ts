import { pgTable, uuid, text, timestamp, date, boolean } from 'drizzle-orm/pg-core'
import { schools } from './schools'
import { academicYears } from './academicYears'

export const calendarEvents = pgTable('calendar_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: uuid('school_id')
    .notNull()
    .references(() => schools.id),
  academicYearId: uuid('academic_year_id')
    .notNull()
    .references(() => academicYears.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  // 'ferias' | 'recesso' | 'feriado' | 'prova' | 'reuniao_pais' | 'conselho_classe' | 'formacao' | 'semana_pedagogica' | 'outro'
  type: text('type').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  affectsAttendance: boolean('affects_attendance').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

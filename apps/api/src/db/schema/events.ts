import { pgTable, uuid, text, timestamp, date, boolean, index } from 'drizzle-orm/pg-core'
import { schools } from './schools'

export const events = pgTable(
  'events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    schoolId: uuid('school_id')
      .notNull()
      .references(() => schools.id),
    title: text('title').notNull(),
    category: text('category').notNull(),
    date: date('date').notNull(),
    startTime: text('start_time'), // HH:MM
    endTime: text('end_time'),     // HH:MM
    allDay: boolean('all_day').notNull().default(false),
    location: text('location'),
    description: text('description'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    schoolDateIdx: index('events_school_date_idx').on(table.schoolId, table.date),
  }),
)

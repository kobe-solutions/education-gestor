import { pgTable, uuid, text, timestamp, integer, uniqueIndex } from 'drizzle-orm/pg-core'
import { schools } from './schools'

export const classPeriods = pgTable(
  'class_periods',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    schoolId: uuid('school_id')
      .notNull()
      .references(() => schools.id),
    name: text('name').notNull(),
    startTime: text('start_time').notNull(), // HH:MM
    endTime: text('end_time').notNull(),     // HH:MM
    order: integer('order').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    schoolOrderUnique: uniqueIndex('class_periods_school_order_unique').on(
      table.schoolId,
      table.order,
    ),
  }),
)

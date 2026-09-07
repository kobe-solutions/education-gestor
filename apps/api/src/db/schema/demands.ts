import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'
import { schools } from './schools'

export const demands = pgTable('demands', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: uuid('school_id')
    .notNull()
    .references(() => schools.id),
  type: text('type').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  responsible: text('responsible'),
  status: text('status').notNull().default('open'),
  priority: text('priority').notNull().default('medium'),
  dueDate: text('due_date'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
})

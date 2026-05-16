import { pgTable, uuid, text, timestamp, date, numeric, index } from 'drizzle-orm/pg-core'
import { schools } from './schools'
import { students } from './students'

export const tuitions = pgTable('tuitions', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: uuid('school_id')
    .notNull()
    .references(() => schools.id),
  studentId: uuid('student_id')
    .notNull()
    .references(() => students.id),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  dueDate: date('due_date').notNull(),
  paidAt: timestamp('paid_at'),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  schoolStatusIdx: index('tuitions_school_status_idx').on(table.schoolId, table.status),
  dueDateIdx: index('tuitions_due_date_idx').on(table.dueDate),
}))

import { pgTable, uuid, text, timestamp, date } from 'drizzle-orm/pg-core'
import { schools } from './schools'

export const students = pgTable('students', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: uuid('school_id')
    .notNull()
    .references(() => schools.id),
  name: text('name').notNull(),
  email: text('email'),
  birthDate: date('birth_date'),
  enrollmentCode: text('enrollment_code').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const guardians = pgTable('guardians', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id')
    .notNull()
    .references(() => students.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  phone: text('phone'),
  relationship: text('relationship').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

import { pgTable, uuid, text, timestamp, date, numeric, boolean } from 'drizzle-orm/pg-core'
import { schools } from './schools'
import { schoolClasses } from './schoolClasses'
import { students } from './students'
import { teachers } from './teachers'

export const grades = pgTable('grades', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: uuid('school_id')
    .notNull()
    .references(() => schools.id),
  classId: uuid('class_id')
    .notNull()
    .references(() => schoolClasses.id),
  studentId: uuid('student_id')
    .notNull()
    .references(() => students.id),
  teacherId: uuid('teacher_id')
    .notNull()
    .references(() => teachers.id),
  subject: text('subject').notNull(),
  value: numeric('value', { precision: 5, scale: 2 }).notNull(),
  period: text('period').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const attendances = pgTable('attendances', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: uuid('school_id')
    .notNull()
    .references(() => schools.id),
  classId: uuid('class_id')
    .notNull()
    .references(() => schoolClasses.id),
  studentId: uuid('student_id')
    .notNull()
    .references(() => students.id),
  date: date('date').notNull(),
  present: boolean('present').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

import { pgTable, uuid, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { schoolClasses } from './schoolClasses'
import { teachers } from './teachers'
import { students } from './students'

export const classTeachers = pgTable(
  'class_teachers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    classId: uuid('class_id')
      .notNull()
      .references(() => schoolClasses.id, { onDelete: 'cascade' }),
    teacherId: uuid('teacher_id')
      .notNull()
      .references(() => teachers.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    uniqueClassTeacher: uniqueIndex('class_teachers_unique').on(table.classId, table.teacherId),
  }),
)

export const classStudents = pgTable(
  'class_students',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    classId: uuid('class_id')
      .notNull()
      .references(() => schoolClasses.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    uniqueClassStudent: uniqueIndex('class_students_unique').on(table.classId, table.studentId),
  }),
)

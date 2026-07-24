import { pgTable, uuid, timestamp, date, boolean, numeric, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { schools } from './schools'
import { schoolClasses } from './schoolClasses'
import { students } from './students'
import { teachers } from './teachers'
import { subjects } from './subjects'
import { academicPeriods } from './academicPeriods'

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
  subjectId: uuid('subject_id')
    .notNull()
    .references(() => subjects.id),
  academicPeriodId: uuid('academic_period_id')
    .notNull()
    .references(() => academicPeriods.id),
  value: numeric('value', { precision: 5, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  studentPeriodIdx: index('grades_student_period_idx').on(table.studentId, table.academicPeriodId),
  classIdx: index('grades_class_idx').on(table.classId),
  uniqueGrade: uniqueIndex('grades_unique_idx').on(table.schoolId, table.classId, table.studentId, table.subjectId, table.academicPeriodId),
}))

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
}, (table) => ({
  classDateIdx: index('att_class_date_idx').on(table.classId, table.date),
  studentIdx: index('att_student_idx').on(table.studentId),
  uniqueAttendance: uniqueIndex('attendance_unique_idx').on(table.schoolId, table.classId, table.studentId, table.date),
}))

import { pgTable, uuid, text, integer, timestamp, date, boolean, numeric, index, uniqueIndex, check } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { schools } from './schools'
import { schoolClasses } from './schoolClasses'
import { students } from './students'
import { teachers } from './teachers'
import { subjects } from './subjects'
import { academicPeriods } from './academicPeriods'

export const assessments = pgTable('assessments', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: uuid('school_id')
    .notNull()
    .references(() => schools.id),
  classId: uuid('class_id')
    .notNull()
    .references(() => schoolClasses.id, { onDelete: 'cascade' }),
  subjectId: uuid('subject_id')
    .notNull()
    .references(() => subjects.id, { onDelete: 'cascade' }),
  academicPeriodId: uuid('academic_period_id')
    .notNull()
    .references(() => academicPeriods.id, { onDelete: 'cascade' }),
  teacherId: uuid('teacher_id')
    .notNull()
    .references(() => teachers.id),
  name: text('name').notNull(),
  weight: numeric('weight', { precision: 5, scale: 2 }).notNull().default('1.00'),
  order: integer('order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  scopeIdx: index('assessments_scope_idx').on(table.schoolId, table.classId, table.subjectId, table.academicPeriodId),
  weightCheck: check('assessments_weight_check', sql`${table.weight} > 0`),
}))

export const periodGradeConfigs = pgTable('period_grade_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: uuid('school_id')
    .notNull()
    .references(() => schools.id),
  classId: uuid('class_id')
    .notNull()
    .references(() => schoolClasses.id, { onDelete: 'cascade' }),
  subjectId: uuid('subject_id')
    .notNull()
    .references(() => subjects.id, { onDelete: 'cascade' }),
  academicPeriodId: uuid('academic_period_id')
    .notNull()
    .references(() => academicPeriods.id, { onDelete: 'cascade' }),
  calculationMethod: text('calculation_method').notNull().default('simple'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  uniqueConfig: uniqueIndex('period_grade_configs_unique_idx').on(
    table.schoolId,
    table.classId,
    table.subjectId,
    table.academicPeriodId,
  ),
  methodCheck: check('period_grade_configs_method_check', sql`${table.calculationMethod} IN ('simple', 'weighted')`),
}))

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
  assessmentId: uuid('assessment_id')
    .references(() => assessments.id, { onDelete: 'cascade' }),
  value: numeric('value', { precision: 5, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  studentPeriodIdx: index('grades_student_period_idx').on(table.studentId, table.academicPeriodId),
  classIdx: index('grades_class_idx').on(table.classId),
  assessmentIdx: index('grades_assessment_idx').on(table.assessmentId),
  uniqueGradeWithAssessment: uniqueIndex('grades_assessment_unique_idx')
    .on(table.schoolId, table.studentId, table.assessmentId)
    .where(sql`${table.assessmentId} IS NOT NULL`),
  uniqueGradeLegacy: uniqueIndex('grades_legacy_unique_idx')
    .on(table.schoolId, table.classId, table.studentId, table.subjectId, table.academicPeriodId)
    .where(sql`${table.assessmentId} IS NULL`),
  gradeValueCheck: check('grades_value_check', sql`${table.value} >= 0 AND ${table.value} <= 10`),
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

import { pgTable, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core'
import { schools } from './schools'
import { teachers } from './teachers'
import { subjects } from './subjects'

export const teacherSubjects = pgTable(
  'teacher_subjects',
  {
    teacherId: uuid('teacher_id')
      .notNull()
      .references(() => teachers.id, { onDelete: 'cascade' }),
    subjectId: uuid('subject_id')
      .notNull()
      .references(() => subjects.id, { onDelete: 'cascade' }),
    schoolId: uuid('school_id')
      .notNull()
      .references(() => schools.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.teacherId, table.subjectId] }),
  }),
)

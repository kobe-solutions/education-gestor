import { pgTable, uuid, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { schools } from './schools'
import { schoolClasses } from './schoolClasses'
import { academicYears } from './academicYears'
import { classPeriods } from './classPeriods'
import { subjects } from './subjects'
import { teachers } from './teachers'

export const timetableSlots = pgTable(
  'timetable_slots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    schoolId: uuid('school_id')
      .notNull()
      .references(() => schools.id),
    classId: uuid('class_id')
      .notNull()
      .references(() => schoolClasses.id, { onDelete: 'cascade' }),
    academicYearId: uuid('academic_year_id')
      .notNull()
      .references(() => academicYears.id),
    classPeriodId: uuid('class_period_id')
      .notNull()
      .references(() => classPeriods.id),
    subjectId: uuid('subject_id')
      .notNull()
      .references(() => subjects.id),
    teacherId: uuid('teacher_id')
      .notNull()
      .references(() => teachers.id),
    weekDay: text('week_day').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    // impede o mesmo professor no mesmo horário padrão no mesmo dia e ano letivo
    uniqueTeacherSlot: uniqueIndex('timetable_teacher_slot_unique').on(
      table.teacherId,
      table.weekDay,
      table.classPeriodId,
      table.academicYearId,
    ),
  }),
)

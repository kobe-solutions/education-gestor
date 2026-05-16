import { pgTable, uuid, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { schools } from './schools'
import { schoolClasses } from './schoolClasses'
import { academicPeriods } from './academicPeriods'
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
    academicPeriodId: uuid('academic_period_id')
      .notNull()
      .references(() => academicPeriods.id),
    subjectId: uuid('subject_id')
      .notNull()
      .references(() => subjects.id),
    teacherId: uuid('teacher_id')
      .notNull()
      .references(() => teachers.id),
    weekDay: text('week_day').notNull(),
    startTime: text('start_time').notNull(),
    endTime: text('end_time').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    // impede o mesmo professor em dois slots com mesmo dia/hora/período
    uniqueTeacherSlot: uniqueIndex('timetable_teacher_slot_unique').on(
      table.teacherId,
      table.weekDay,
      table.startTime,
      table.academicPeriodId,
    ),
  }),
)

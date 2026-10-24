import { pgTable, uuid, text, timestamp, date, jsonb, index } from 'drizzle-orm/pg-core'
import { schools } from './schools'
import { schoolClasses } from './schoolClasses'
import { subjects } from './subjects'
import { teachers } from './teachers'
import { timetableSlots } from './timetableSlots'

export type LessonRecordAttachment = {
  name: string
  url: string
  key: string
  contentType: string
  size: number
}

export const lessonRecords = pgTable(
  'lesson_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    schoolId: uuid('school_id').notNull().references(() => schools.id),
    teacherId: uuid('teacher_id').notNull().references(() => teachers.id),
    classId: uuid('class_id').notNull().references(() => schoolClasses.id),
    subjectId: uuid('subject_id').notNull().references(() => subjects.id),
    timetableSlotId: uuid('timetable_slot_id').references(() => timetableSlots.id, { onDelete: 'set null' }),
    date: date('date').notNull(),
    title: text('title').notNull(),
    topic: text('topic').notNull(),
    description: text('description'),
    attachments: jsonb('attachments').$type<LessonRecordAttachment[]>().notNull().default([]),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    schoolDateIdx: index('lesson_records_school_date_idx').on(table.schoolId, table.date),
    teacherDateIdx: index('lesson_records_teacher_date_idx').on(table.teacherId, table.date),
    timetableSlotIdx: index('lesson_records_timetable_slot_idx').on(table.timetableSlotId),
  }),
)

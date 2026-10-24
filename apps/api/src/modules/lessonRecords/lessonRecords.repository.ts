import { and, desc, eq, gte, lte } from 'drizzle-orm'
import { db } from '../../db'
import { lessonRecords, schoolClasses, subjects, teachers, timetableSlots } from '../../db/schema'
import type { LessonRecordAttachment } from '../../db/schema/lessonRecords'

const recordFields = {
  id: lessonRecords.id,
  schoolId: lessonRecords.schoolId,
  teacherId: lessonRecords.teacherId,
  teacherName: teachers.name,
  classId: lessonRecords.classId,
  className: schoolClasses.name,
  subjectId: lessonRecords.subjectId,
  subjectName: subjects.name,
  timetableSlotId: lessonRecords.timetableSlotId,
  date: lessonRecords.date,
  title: lessonRecords.title,
  topic: lessonRecords.topic,
  description: lessonRecords.description,
  attachments: lessonRecords.attachments,
  createdAt: lessonRecords.createdAt,
}

export async function listLessonRecordsRepository(
  schoolId: string,
  filters: { from: string; to: string; teacherId?: string; classId?: string; ownTeacherId?: string },
) {
  const conditions = [
    eq(lessonRecords.schoolId, schoolId),
    eq(teachers.schoolId, schoolId),
    eq(schoolClasses.schoolId, schoolId),
    eq(subjects.schoolId, schoolId),
    gte(lessonRecords.date, filters.from),
    lte(lessonRecords.date, filters.to),
  ]
  if (filters.teacherId) conditions.push(eq(lessonRecords.teacherId, filters.teacherId))
  if (filters.classId) conditions.push(eq(lessonRecords.classId, filters.classId))
  if (filters.ownTeacherId) conditions.push(eq(lessonRecords.teacherId, filters.ownTeacherId))

  return db.select(recordFields)
    .from(lessonRecords)
    .innerJoin(teachers, eq(lessonRecords.teacherId, teachers.id))
    .innerJoin(schoolClasses, eq(lessonRecords.classId, schoolClasses.id))
    .innerJoin(subjects, eq(lessonRecords.subjectId, subjects.id))
    .where(and(...conditions))
    .orderBy(desc(lessonRecords.date), desc(lessonRecords.createdAt))
}

export async function findLessonRecordRepository(schoolId: string, id: string) {
  const [record] = await db.select(recordFields)
    .from(lessonRecords)
    .innerJoin(teachers, eq(lessonRecords.teacherId, teachers.id))
    .innerJoin(schoolClasses, eq(lessonRecords.classId, schoolClasses.id))
    .innerJoin(subjects, eq(lessonRecords.subjectId, subjects.id))
    .where(and(
      eq(lessonRecords.schoolId, schoolId),
      eq(lessonRecords.id, id),
      eq(teachers.schoolId, schoolId),
      eq(schoolClasses.schoolId, schoolId),
      eq(subjects.schoolId, schoolId),
    ))
    .limit(1)
  return record
}

export async function createLessonRecordRepository(input: {
  schoolId: string
  teacherId: string
  classId: string
  subjectId: string
  timetableSlotId: string
  date: string
  title: string
  topic: string
  description: string | null
  attachments: LessonRecordAttachment[]
}) {
  const [record] = await db.insert(lessonRecords).values(input).returning({ id: lessonRecords.id })
  return findLessonRecordRepository(input.schoolId, record.id)
}

export async function updateLessonRecordRepository(
  schoolId: string,
  id: string,
  teacherId: string,
  input: {
    classId: string
    subjectId: string
    timetableSlotId: string | null
    date: string
    title: string
    topic: string
    description: string | null
    attachments: LessonRecordAttachment[]
  },
) {
  const [updated] = await db.update(lessonRecords)
    .set(input)
    .where(and(
      eq(lessonRecords.schoolId, schoolId),
      eq(lessonRecords.id, id),
      eq(lessonRecords.teacherId, teacherId),
    ))
    .returning({ id: lessonRecords.id })
  return updated ? findLessonRecordRepository(schoolId, updated.id) : undefined
}

export async function deleteLessonRecordRepository(schoolId: string, id: string, teacherId: string) {
  const [deleted] = await db.delete(lessonRecords)
    .where(and(
      eq(lessonRecords.schoolId, schoolId),
      eq(lessonRecords.id, id),
      eq(lessonRecords.teacherId, teacherId),
    ))
    .returning({ id: lessonRecords.id })
  return deleted
}

export async function getLessonRecordCalendarRepository(schoolId: string, from: string, to: string) {
  const schedule = await db.select({
    teacherId: timetableSlots.teacherId,
    classId: timetableSlots.classId,
    subjectId: timetableSlots.subjectId,
    weekDay: timetableSlots.weekDay,
  }).from(timetableSlots)
    .innerJoin(teachers, eq(timetableSlots.teacherId, teachers.id))
    .innerJoin(schoolClasses, eq(timetableSlots.classId, schoolClasses.id))
    .innerJoin(subjects, eq(timetableSlots.subjectId, subjects.id))
    .where(and(
      eq(timetableSlots.schoolId, schoolId),
      eq(teachers.schoolId, schoolId),
      eq(schoolClasses.schoolId, schoolId),
      eq(subjects.schoolId, schoolId),
    ))

  const records = await db.select({
    teacherId: lessonRecords.teacherId,
    classId: lessonRecords.classId,
    subjectId: lessonRecords.subjectId,
    date: lessonRecords.date,
  }).from(lessonRecords).where(and(
    eq(lessonRecords.schoolId, schoolId),
    gte(lessonRecords.date, from),
    lte(lessonRecords.date, to),
  ))
  return { schedule, records }
}

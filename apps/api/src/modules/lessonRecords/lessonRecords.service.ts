import { createLessonRecordRepository, deleteLessonRecordRepository, findLessonRecordRepository, getLessonRecordCalendarRepository, listLessonRecordsRepository, updateLessonRecordRepository } from './lessonRecords.repository'
import { db } from '../../db'
import { and, eq } from 'drizzle-orm'
import { timetableSlots, teachers, schoolClasses, subjects } from '../../db/schema'
import type { LessonRecordAttachment } from '../../db/schema/lessonRecords'

function monthBounds(month?: string) {
  const chosen = month && /^\d{4}-\d{2}$/.test(month) ? month : new Date().toISOString().slice(0, 7)
  const [year, monthNumber] = chosen.split('-').map(Number)
  const from = `${chosen}-01`
  const to = `${year}-${String(monthNumber).padStart(2, '0')}-${String(new Date(Date.UTC(year, monthNumber, 0)).getUTCDate()).padStart(2, '0')}`
  return { month: chosen, from, to }
}

export async function getLessonRecordSummaryService(schoolId: string, month?: string) {
  const bounds = monthBounds(month)
  const { schedule, records } = await getLessonRecordCalendarRepository(schoolId, bounds.from, bounds.to)
  const weekday: Record<string, string> = {
    monday: '1', tuesday: '2', wednesday: '3', thursday: '4', friday: '5', saturday: '6', sunday: '0',
  }
  const registered = new Map<string, number>()
  for (const record of records) {
    const key = `${record.teacherId}:${record.classId}:${record.subjectId}:${record.date}`
    registered.set(key, (registered.get(key) ?? 0) + 1)
  }
  const today = new Date().toISOString().slice(0, 10)
  let planned = 0
  let recorded = 0
  let pending = 0
  let future = 0
  for (let cursor = new Date(`${bounds.from}T00:00:00Z`); cursor <= new Date(`${bounds.to}T00:00:00Z`); cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const date = cursor.toISOString().slice(0, 10)
    const day = String(cursor.getUTCDay())
    for (const slot of schedule) {
      if (weekday[slot.weekDay] !== day) continue
      const key = `${slot.teacherId}:${slot.classId}:${slot.subjectId}:${date}`
      const alreadyRecorded = registered.get(key) ?? 0
      planned += 1
      if (date > today) future += 1
      else if (alreadyRecorded > 0) {
        recorded += 1
        registered.set(key, alreadyRecorded - 1)
      } else pending += 1
    }
  }
  return {
    month: bounds.month,
    planned,
    registered: recorded,
    pending,
    future,
    rate: planned - future > 0 ? Math.round((recorded / (planned - future)) * 100) : 0,
  }
}

export async function listLessonRecordsService(
  schoolId: string,
  filters: { from?: string; to?: string; teacherId?: string; classId?: string; ownTeacherId?: string },
) {
  const bounds = monthBounds()
  return listLessonRecordsRepository(schoolId, {
    from: filters.from ?? bounds.from,
    to: filters.to ?? bounds.to,
    ...(filters.teacherId ? { teacherId: filters.teacherId } : {}),
    ...(filters.classId ? { classId: filters.classId } : {}),
    ...(filters.ownTeacherId ? { ownTeacherId: filters.ownTeacherId } : {}),
  })
}

export async function getLessonRecordService(schoolId: string, id: string, ownTeacherId?: string) {
  const record = await findLessonRecordRepository(schoolId, id)
  if (!record || (ownTeacherId && record.teacherId !== ownTeacherId)) throw new Error('Lesson record not found')
  return record
}

export async function validateLessonAssignmentService(
  schoolId: string,
  teacherId: string,
  classId: string,
  subjectId: string,
  timetableSlotId?: string,
  date?: string,
) {
  const conditions = [
    eq(timetableSlots.schoolId, schoolId),
    eq(timetableSlots.teacherId, teacherId),
    eq(timetableSlots.classId, classId),
    eq(timetableSlots.subjectId, subjectId),
    eq(teachers.schoolId, schoolId),
    eq(schoolClasses.schoolId, schoolId),
    eq(subjects.schoolId, schoolId),
  ]
  if (timetableSlotId) conditions.push(eq(timetableSlots.id, timetableSlotId))

  const [assignment] = await db.select({ id: timetableSlots.id, weekDay: timetableSlots.weekDay })
    .from(timetableSlots)
    .innerJoin(teachers, eq(timetableSlots.teacherId, teachers.id))
    .innerJoin(schoolClasses, eq(timetableSlots.classId, schoolClasses.id))
    .innerJoin(subjects, eq(timetableSlots.subjectId, subjects.id))
    .where(and(...conditions)).limit(1)
  if (!assignment) throw new Error('Class or subject is not assigned to this teacher')
  if (timetableSlotId && date) {
    const scheduledDay = new Date(`${date}T00:00:00Z`).getUTCDay()
    const weekdayName: Record<number, string> = {
      0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday', 5: 'friday', 6: 'saturday',
    }
    if (assignment.weekDay !== weekdayName[scheduledDay]) {
      throw new Error('Selected date does not match the timetable day')
    }
  }
}

export function createLessonRecordService(input: {
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
  return createLessonRecordRepository(input)
}

export function updateLessonRecordService(
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
  return updateLessonRecordRepository(schoolId, id, teacherId, input)
}

export async function deleteLessonRecordService(schoolId: string, id: string, teacherId: string) {
  const record = await getLessonRecordService(schoolId, id, teacherId)
  const deleted = await deleteLessonRecordRepository(schoolId, id, teacherId)
  return deleted ? record : undefined
}

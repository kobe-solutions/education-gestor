import { and, eq, ne } from 'drizzle-orm'
import { db } from '../../db'
import { timetableSlots, subjects, teachers, classPeriods } from '../../db/schema'

const slotFields = {
  id: timetableSlots.id,
  schoolId: timetableSlots.schoolId,
  classId: timetableSlots.classId,
  academicYearId: timetableSlots.academicYearId,
  classPeriodId: timetableSlots.classPeriodId,
  subjectId: timetableSlots.subjectId,
  teacherId: timetableSlots.teacherId,
  weekDay: timetableSlots.weekDay,
  createdAt: timetableSlots.createdAt,
}

const withJoins = {
  ...slotFields,
  subject: { id: subjects.id, name: subjects.name },
  teacher: { id: teachers.id, name: teachers.name },
  classPeriod: {
    id: classPeriods.id,
    name: classPeriods.name,
    startTime: classPeriods.startTime,
    endTime: classPeriods.endTime,
    order: classPeriods.order,
  },
}

type CreateInput = {
  schoolId: string
  classId: string
  academicYearId: string
  classPeriodId: string
  subjectId: string
  teacherId: string
  weekDay: string
}

export async function createTimetableSlotRepository(input: CreateInput) {
  const [slot] = await db.insert(timetableSlots).values(input).returning(slotFields)
  return slot
}

export async function listTimetableSlotsRepository(schoolId: string, classId: string) {
  return db
    .select(withJoins)
    .from(timetableSlots)
    .innerJoin(subjects, eq(timetableSlots.subjectId, subjects.id))
    .innerJoin(teachers, eq(timetableSlots.teacherId, teachers.id))
    .innerJoin(classPeriods, eq(timetableSlots.classPeriodId, classPeriods.id))
    .where(and(eq(timetableSlots.schoolId, schoolId), eq(timetableSlots.classId, classId)))
    .orderBy(timetableSlots.weekDay, classPeriods.order)
}

export async function findTimetableSlotByIdRepository(schoolId: string, id: string) {
  const [slot] = await db
    .select(withJoins)
    .from(timetableSlots)
    .innerJoin(subjects, eq(timetableSlots.subjectId, subjects.id))
    .innerJoin(teachers, eq(timetableSlots.teacherId, teachers.id))
    .innerJoin(classPeriods, eq(timetableSlots.classPeriodId, classPeriods.id))
    .where(and(eq(timetableSlots.schoolId, schoolId), eq(timetableSlots.id, id)))
    .limit(1)

  return slot
}

export async function findConflictingSlotRepository(
  teacherId: string,
  weekDay: string,
  classPeriodId: string,
  academicYearId: string,
  excludeSlotId?: string,
) {
  const conditions = [
    eq(timetableSlots.teacherId, teacherId),
    eq(timetableSlots.weekDay, weekDay),
    eq(timetableSlots.classPeriodId, classPeriodId),
    eq(timetableSlots.academicYearId, academicYearId),
  ]

  if (excludeSlotId) conditions.push(ne(timetableSlots.id, excludeSlotId))

  const [conflict] = await db
    .select({ id: timetableSlots.id })
    .from(timetableSlots)
    .where(and(...conditions))
    .limit(1)

  return conflict
}

export async function updateTimetableSlotRepository(
  schoolId: string,
  id: string,
  input: { classPeriodId?: string; subjectId?: string; teacherId?: string; weekDay?: string },
) {
  const [slot] = await db
    .update(timetableSlots)
    .set(input)
    .where(and(eq(timetableSlots.schoolId, schoolId), eq(timetableSlots.id, id)))
    .returning(slotFields)

  return slot
}

export async function deleteTimetableSlotRepository(schoolId: string, id: string) {
  await db
    .delete(timetableSlots)
    .where(and(eq(timetableSlots.schoolId, schoolId), eq(timetableSlots.id, id)))
}

export async function listAllTimetableSlotsRepository(schoolId: string) {
  return db
    .select(withJoins)
    .from(timetableSlots)
    .innerJoin(subjects, eq(timetableSlots.subjectId, subjects.id))
    .innerJoin(teachers, eq(timetableSlots.teacherId, teachers.id))
    .innerJoin(classPeriods, eq(timetableSlots.classPeriodId, classPeriods.id))
    .where(eq(timetableSlots.schoolId, schoolId))
    .orderBy(timetableSlots.classId, timetableSlots.weekDay, classPeriods.order)
}

export async function findDistinctTeachersByClassRepository(schoolId: string, classId: string) {
  return db
    .selectDistinct({ id: teachers.id, name: teachers.name, email: teachers.email })
    .from(timetableSlots)
    .innerJoin(teachers, eq(timetableSlots.teacherId, teachers.id))
    .where(and(eq(timetableSlots.schoolId, schoolId), eq(timetableSlots.classId, classId)))
}

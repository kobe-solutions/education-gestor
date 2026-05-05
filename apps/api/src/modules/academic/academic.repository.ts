import { eq, and } from 'drizzle-orm'
import { db } from '../../db'
import { grades, attendances } from '../../db/schema'

type UpsertGradeInput = {
  schoolId: string
  classId: string
  studentId: string
  teacherId: string
  subject: string
  value: string
  period: string
}

type UpsertAttendanceInput = {
  schoolId: string
  classId: string
  studentId: string
  date: string
  present: boolean
}

export async function upsertGradeRepository(input: UpsertGradeInput) {
  const existing = await db
    .select({ id: grades.id })
    .from(grades)
    .where(
      and(
        eq(grades.schoolId, input.schoolId),
        eq(grades.classId, input.classId),
        eq(grades.studentId, input.studentId),
        eq(grades.subject, input.subject),
        eq(grades.period, input.period),
      ),
    )
    .limit(1)

  if (existing.length) {
    const [grade] = await db
      .update(grades)
      .set({ value: input.value, teacherId: input.teacherId, updatedAt: new Date() })
      .where(eq(grades.id, existing[0].id))
      .returning()
    return grade
  }

  const [grade] = await db
    .insert(grades)
    .values({
      schoolId: input.schoolId,
      classId: input.classId,
      studentId: input.studentId,
      teacherId: input.teacherId,
      subject: input.subject,
      value: input.value,
      period: input.period,
    })
    .returning()

  return grade
}

export async function findGradesByStudentRepository(schoolId: string, studentId: string) {
  return db
    .select({
      id: grades.id,
      classId: grades.classId,
      subject: grades.subject,
      value: grades.value,
      period: grades.period,
      createdAt: grades.createdAt,
    })
    .from(grades)
    .where(and(eq(grades.schoolId, schoolId), eq(grades.studentId, studentId)))
}

export async function findGradesByClassRepository(schoolId: string, classId: string) {
  return db
    .select({
      id: grades.id,
      studentId: grades.studentId,
      subject: grades.subject,
      value: grades.value,
      period: grades.period,
      createdAt: grades.createdAt,
    })
    .from(grades)
    .where(and(eq(grades.schoolId, schoolId), eq(grades.classId, classId)))
}

export async function upsertAttendanceRepository(input: UpsertAttendanceInput) {
  const existing = await db
    .select({ id: attendances.id })
    .from(attendances)
    .where(
      and(
        eq(attendances.schoolId, input.schoolId),
        eq(attendances.classId, input.classId),
        eq(attendances.studentId, input.studentId),
        eq(attendances.date, input.date),
      ),
    )
    .limit(1)

  if (existing.length) {
    const [attendance] = await db
      .update(attendances)
      .set({ present: input.present })
      .where(eq(attendances.id, existing[0].id))
      .returning()
    return attendance
  }

  const [attendance] = await db
    .insert(attendances)
    .values({
      schoolId: input.schoolId,
      classId: input.classId,
      studentId: input.studentId,
      date: input.date,
      present: input.present,
    })
    .returning()

  return attendance
}

export async function findAttendancesByStudentRepository(schoolId: string, studentId: string) {
  return db
    .select({
      id: attendances.id,
      classId: attendances.classId,
      date: attendances.date,
      present: attendances.present,
    })
    .from(attendances)
    .where(and(eq(attendances.schoolId, schoolId), eq(attendances.studentId, studentId)))
}

export async function findAttendancesByClassAndDateRepository(
  schoolId: string,
  classId: string,
  date: string,
) {
  return db
    .select({
      id: attendances.id,
      studentId: attendances.studentId,
      date: attendances.date,
      present: attendances.present,
    })
    .from(attendances)
    .where(
      and(
        eq(attendances.schoolId, schoolId),
        eq(attendances.classId, classId),
        eq(attendances.date, date),
      ),
    )
}

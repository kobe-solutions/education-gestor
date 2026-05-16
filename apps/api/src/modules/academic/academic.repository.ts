import { eq, and, sql } from 'drizzle-orm'
import { db } from '../../db'
import { grades, attendances } from '../../db/schema'
import { subjects } from '../../db/schema/subjects'
import { academicPeriods } from '../../db/schema/academicPeriods'

type UpsertGradeInput = {
  schoolId: string
  classId: string
  studentId: string
  teacherId: string
  subjectId: string
  academicPeriodId: string
  value: number
}

type UpsertAttendanceInput = {
  schoolId: string
  classId: string
  studentId: string
  date: string
  present: boolean
}

const gradeFields = {
  id: grades.id,
  classId: grades.classId,
  studentId: grades.studentId,
  teacherId: grades.teacherId,
  subjectId: grades.subjectId,
  academicPeriodId: grades.academicPeriodId,
  value: grades.value,
  createdAt: grades.createdAt,
  subject: { id: subjects.id, name: subjects.name },
  academicPeriod: { id: academicPeriods.id, name: academicPeriods.name },
}

export async function upsertGradeRepository(input: UpsertGradeInput) {
  const [row] = await db
    .insert(grades)
    .values({
      schoolId: input.schoolId,
      classId: input.classId,
      studentId: input.studentId,
      teacherId: input.teacherId,
      subjectId: input.subjectId,
      academicPeriodId: input.academicPeriodId,
      value: input.value.toString(),
    })
    .onConflictDoUpdate({
      target: [grades.schoolId, grades.classId, grades.studentId, grades.subjectId, grades.academicPeriodId],
      set: { value: sql`excluded.value`, teacherId: sql`excluded.teacher_id`, updatedAt: new Date() },
    })
    .returning({ id: grades.id })

  return db
    .select(gradeFields)
    .from(grades)
    .leftJoin(subjects, eq(grades.subjectId, subjects.id))
    .leftJoin(academicPeriods, eq(grades.academicPeriodId, academicPeriods.id))
    .where(eq(grades.id, row.id))
    .limit(1)
    .then((rows) => rows[0])
}

export async function findGradesByStudentRepository(schoolId: string, studentId: string) {
  return db
    .select(gradeFields)
    .from(grades)
    .leftJoin(subjects, eq(grades.subjectId, subjects.id))
    .leftJoin(academicPeriods, eq(grades.academicPeriodId, academicPeriods.id))
    .where(and(eq(grades.schoolId, schoolId), eq(grades.studentId, studentId)))
}

export async function findGradesByClassRepository(schoolId: string, classId: string) {
  return db
    .select(gradeFields)
    .from(grades)
    .leftJoin(subjects, eq(grades.subjectId, subjects.id))
    .leftJoin(academicPeriods, eq(grades.academicPeriodId, academicPeriods.id))
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

export async function upsertBulkAttendanceRepository(
  rows: UpsertAttendanceInput[],
) {
  if (rows.length === 0) return []
  return db
    .insert(attendances)
    .values(rows)
    .onConflictDoUpdate({
      target: [attendances.schoolId, attendances.classId, attendances.studentId, attendances.date],
      set: { present: sql`excluded.present` },
    })
    .returning()
}

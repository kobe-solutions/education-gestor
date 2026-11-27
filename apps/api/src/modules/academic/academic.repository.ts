import { eq, and, asc, inArray, sql } from 'drizzle-orm'
import { db } from '../../db'
import { grades, attendances, assessments, periodGradeConfigs } from '../../db/schema'
import { subjects } from '../../db/schema/subjects'
import { academicPeriods } from '../../db/schema/academicPeriods'
import { schoolClasses } from '../../db/schema/schoolClasses'

type UpsertGradeInput = {
  schoolId: string
  classId: string
  studentId: string
  teacherId: string
  subjectId: string
  academicPeriodId: string
  assessmentId?: string | null
  value: number
}

type UpsertAttendanceInput = {
  schoolId: string
  classId: string
  studentId: string
  date: string
  present: boolean
}

type BulkGradeInput = {
  schoolId: string
  classId: string
  studentId: string
  teacherId: string
  subjectId: string
  academicPeriodId: string
  assessmentId?: string | null
  value: number
}

type CreateAssessmentInput = {
  schoolId: string
  classId: string
  subjectId: string
  academicPeriodId: string
  teacherId: string
  name: string
  weight: number
}

type UpdateAssessmentInput = {
  name?: string
  weight?: number
  order?: number
}

type UpsertPeriodGradeConfigInput = {
  schoolId: string
  classId: string
  subjectId: string
  academicPeriodId: string
  calculationMethod: 'simple' | 'weighted'
}

const gradeFields = {
  id: grades.id,
  classId: grades.classId,
  studentId: grades.studentId,
  teacherId: grades.teacherId,
  subjectId: grades.subjectId,
  academicPeriodId: grades.academicPeriodId,
  assessmentId: grades.assessmentId,
  value: grades.value,
  createdAt: grades.createdAt,
  subject: { id: subjects.id, name: subjects.name },
  academicPeriod: { id: academicPeriods.id, name: academicPeriods.name },
  assessment: { id: assessments.id, name: assessments.name, weight: assessments.weight },
}

export async function upsertGradeRepository(input: UpsertGradeInput) {
  const assessmentId = input.assessmentId ?? null

  const [row] = assessmentId
    ? await db
        .insert(grades)
        .values({
          schoolId: input.schoolId,
          classId: input.classId,
          studentId: input.studentId,
          teacherId: input.teacherId,
          subjectId: input.subjectId,
          academicPeriodId: input.academicPeriodId,
          assessmentId,
          value: input.value.toString(),
        })
        .onConflictDoUpdate({
          target: [grades.schoolId, grades.studentId, grades.assessmentId],
          targetWhere: sql`${grades.assessmentId} IS NOT NULL`,
          set: { value: sql`excluded.value`, teacherId: sql`excluded.teacher_id`, updatedAt: new Date() },
        })
        .returning({ id: grades.id })
    : await db
        .insert(grades)
        .values({
          schoolId: input.schoolId,
          classId: input.classId,
          studentId: input.studentId,
          teacherId: input.teacherId,
          subjectId: input.subjectId,
          academicPeriodId: input.academicPeriodId,
          assessmentId: null,
          value: input.value.toString(),
        })
        .onConflictDoUpdate({
          target: [grades.schoolId, grades.classId, grades.studentId, grades.subjectId, grades.academicPeriodId],
          targetWhere: sql`${grades.assessmentId} IS NULL`,
          set: { value: sql`excluded.value`, teacherId: sql`excluded.teacher_id`, updatedAt: new Date() },
        })
        .returning({ id: grades.id })

  return db
    .select(gradeFields)
    .from(grades)
    .leftJoin(subjects, eq(grades.subjectId, subjects.id))
    .leftJoin(academicPeriods, eq(grades.academicPeriodId, academicPeriods.id))
    .leftJoin(assessments, eq(grades.assessmentId, assessments.id))
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
    .leftJoin(assessments, eq(grades.assessmentId, assessments.id))
    .where(and(eq(grades.schoolId, schoolId), eq(grades.studentId, studentId)))
}

export async function findGradesByClassRepository(schoolId: string, classId: string) {
  return db
    .select(gradeFields)
    .from(grades)
    .leftJoin(subjects, eq(grades.subjectId, subjects.id))
    .leftJoin(academicPeriods, eq(grades.academicPeriodId, academicPeriods.id))
    .leftJoin(assessments, eq(grades.assessmentId, assessments.id))
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

export async function upsertBulkGradesRepository(rows: BulkGradeInput[]) {
  if (rows.length === 0) return []

  const withAssessment = rows.filter((row) => !!row.assessmentId)
  const legacy = rows.filter((row) => !row.assessmentId)

  const results = []

  if (withAssessment.length > 0) {
    const inserted = await db
      .insert(grades)
      .values(withAssessment.map((row) => ({ ...row, assessmentId: row.assessmentId!, value: row.value.toString() })))
      .onConflictDoUpdate({
        target: [grades.schoolId, grades.studentId, grades.assessmentId],
        targetWhere: sql`${grades.assessmentId} IS NOT NULL`,
        set: { value: sql`excluded.value`, teacherId: sql`excluded.teacher_id`, updatedAt: new Date() },
      })
      .returning()
    results.push(...inserted)
  }

  if (legacy.length > 0) {
    const inserted = await db
      .insert(grades)
      .values(legacy.map((row) => ({ ...row, assessmentId: null, value: row.value.toString() })))
      .onConflictDoUpdate({
        target: [grades.schoolId, grades.classId, grades.studentId, grades.subjectId, grades.academicPeriodId],
        targetWhere: sql`${grades.assessmentId} IS NULL`,
        set: { value: sql`excluded.value`, teacherId: sql`excluded.teacher_id`, updatedAt: new Date() },
      })
      .returning()
    results.push(...inserted)
  }

  return results
}

export async function deleteGradesByIdsRepository(schoolId: string, gradeIds: string[]) {
  if (gradeIds.length === 0) return []
  return db
    .delete(grades)
    .where(and(eq(grades.schoolId, schoolId), inArray(grades.id, gradeIds)))
    .returning({ id: grades.id })
}

// ─── Assessments (Métodos de Avaliação) ───────────────────────────────────────

export async function findAssessmentsByClassRepository(
  schoolId: string,
  classId: string,
  subjectId?: string,
  academicPeriodId?: string,
) {
  const conditions = [eq(assessments.schoolId, schoolId), eq(assessments.classId, classId)]
  if (subjectId) conditions.push(eq(assessments.subjectId, subjectId))
  if (academicPeriodId) conditions.push(eq(assessments.academicPeriodId, academicPeriodId))

  return db
    .select()
    .from(assessments)
    .where(and(...conditions))
    .orderBy(asc(assessments.order), asc(assessments.createdAt))
}

export async function findAssessmentByIdRepository(schoolId: string, id: string) {
  const [row] = await db
    .select()
    .from(assessments)
    .where(and(eq(assessments.schoolId, schoolId), eq(assessments.id, id)))
    .limit(1)
  return row ?? null
}

export async function createAssessmentRepository(input: CreateAssessmentInput) {
  const existing = await db
    .select({ order: assessments.order })
    .from(assessments)
    .where(
      and(
        eq(assessments.schoolId, input.schoolId),
        eq(assessments.classId, input.classId),
        eq(assessments.subjectId, input.subjectId),
        eq(assessments.academicPeriodId, input.academicPeriodId),
      ),
    )

  const nextOrder = existing.length > 0 ? Math.max(...existing.map((e) => e.order)) + 1 : 0

  const [row] = await db
    .insert(assessments)
    .values({
      schoolId: input.schoolId,
      classId: input.classId,
      subjectId: input.subjectId,
      academicPeriodId: input.academicPeriodId,
      teacherId: input.teacherId,
      name: input.name,
      weight: input.weight.toString(),
      order: nextOrder,
    })
    .returning()

  return row
}

export async function updateAssessmentRepository(
  schoolId: string,
  id: string,
  data: UpdateAssessmentInput,
) {
  const updateSet: Record<string, unknown> = { updatedAt: new Date() }
  if (data.name !== undefined) updateSet.name = data.name
  if (data.weight !== undefined) updateSet.weight = data.weight.toString()
  if (data.order !== undefined) updateSet.order = data.order

  const [row] = await db
    .update(assessments)
    .set(updateSet)
    .where(and(eq(assessments.schoolId, schoolId), eq(assessments.id, id)))
    .returning()

  return row ?? null
}

export async function deleteAssessmentRepository(schoolId: string, id: string) {
  const [row] = await db
    .delete(assessments)
    .where(and(eq(assessments.schoolId, schoolId), eq(assessments.id, id)))
    .returning()

  return row ?? null
}

// ─── Period Grade Configs (Média Simples / Ponderada) ─────────────────────────

export async function findPeriodGradeConfigsByClassRepository(
  schoolId: string,
  classId: string,
  subjectId?: string,
) {
  const conditions = [eq(periodGradeConfigs.schoolId, schoolId), eq(periodGradeConfigs.classId, classId)]
  if (subjectId) conditions.push(eq(periodGradeConfigs.subjectId, subjectId))

  return db
    .select()
    .from(periodGradeConfigs)
    .where(and(...conditions))
}

export async function upsertPeriodGradeConfigRepository(input: UpsertPeriodGradeConfigInput) {
  const [row] = await db
    .insert(periodGradeConfigs)
    .values({
      schoolId: input.schoolId,
      classId: input.classId,
      subjectId: input.subjectId,
      academicPeriodId: input.academicPeriodId,
      calculationMethod: input.calculationMethod,
    })
    .onConflictDoUpdate({
      target: [
        periodGradeConfigs.schoolId,
        periodGradeConfigs.classId,
        periodGradeConfigs.subjectId,
        periodGradeConfigs.academicPeriodId,
      ],
      set: {
        calculationMethod: sql`excluded.calculation_method`,
        updatedAt: new Date(),
      },
    })
    .returning()

  return row
}

// ─── Boletim ──────────────────────────────────────────────────────────────────

export type StudentReportGradeRow = {
  classId: string
  className: string | null
  subjectId: string
  subjectName: string | null
  academicPeriodId: string
  academicPeriodName: string | null
  academicPeriodOrder: number | null
  assessmentId?: string | null
  assessmentWeight?: string | null
  value: string
}

export type StudentReportConfigRow = {
  classId: string
  subjectId: string
  academicPeriodId: string
  calculationMethod: string
}

export type StudentReportAttendanceRow = {
  classId: string
  present: boolean
}

export type StudentReportData = {
  grades: StudentReportGradeRow[]
  attendances: StudentReportAttendanceRow[]
  configs?: StudentReportConfigRow[]
}

export async function findStudentReportDataRepository(
  schoolId: string,
  studentId: string,
): Promise<StudentReportData> {
  const [gradeRows, attendanceRows, configRows] = await Promise.all([
    db
      .select({
        classId: grades.classId,
        className: schoolClasses.name,
        subjectId: grades.subjectId,
        subjectName: subjects.name,
        academicPeriodId: grades.academicPeriodId,
        academicPeriodName: academicPeriods.name,
        academicPeriodOrder: academicPeriods.order,
        assessmentId: grades.assessmentId,
        assessmentWeight: assessments.weight,
        value: grades.value,
      })
      .from(grades)
      .leftJoin(subjects, eq(grades.subjectId, subjects.id))
      .leftJoin(academicPeriods, eq(grades.academicPeriodId, academicPeriods.id))
      .leftJoin(schoolClasses, eq(grades.classId, schoolClasses.id))
      .leftJoin(assessments, eq(grades.assessmentId, assessments.id))
      .where(and(eq(grades.schoolId, schoolId), eq(grades.studentId, studentId))),
    db
      .select({
        classId: attendances.classId,
        present: attendances.present,
      })
      .from(attendances)
      .where(and(eq(attendances.schoolId, schoolId), eq(attendances.studentId, studentId))),
    db
      .select({
        classId: periodGradeConfigs.classId,
        subjectId: periodGradeConfigs.subjectId,
        academicPeriodId: periodGradeConfigs.academicPeriodId,
        calculationMethod: periodGradeConfigs.calculationMethod,
      })
      .from(periodGradeConfigs)
      .where(eq(periodGradeConfigs.schoolId, schoolId)),
  ])

  return { grades: gradeRows, attendances: attendanceRows, configs: configRows }
}

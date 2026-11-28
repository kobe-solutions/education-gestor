import { db } from '../../db'
import {
  upsertGradeRepository,
  findGradesByStudentRepository,
  findGradesByClassRepository,
  upsertAttendanceRepository,
  upsertBulkAttendanceRepository,
  findAttendancesByStudentRepository,
  findAttendancesByClassAndDateRepository,
  upsertBulkGradesRepository,
  deleteGradesByIdsRepository,
  findAssessmentsByClassRepository,
  findAssessmentByIdRepository,
  createAssessmentRepository,
  updateAssessmentRepository,
  deleteAssessmentRepository,
  findPeriodGradeConfigsByClassRepository,
  upsertPeriodGradeConfigRepository,
  findStudentReportDataRepository,
} from './academic.repository'
import type {
  StudentReportAttendanceRow,
  StudentReportGradeRow,
} from './academic.repository'
import { getStudentService } from '../students/students.service'
import { getSchoolClassService } from '../classes/schoolClasses.service'
import { findStudentCurrentClassRepository } from '../classes/schoolClasses.repository'
import { findSubjectsByClassRepository } from '../timetable/timetable.repository'
import { findSchoolByIdRepository } from '../schools/schools.repository'
import { validateGradeValue } from '../../lib/validators'
import type {
  GradeCalculationMethod,
  ReportAttendance,
  ReportSituation,
  StudentReport,
  SubjectReport,
} from '@education-gestor/types'

type RegisterGradeInput = {
  schoolId: string
  classId: string
  studentId: string
  teacherId: string
  subjectId: string
  academicPeriodId: string
  assessmentId?: string | null
  value: number
}

type RegisterAttendanceInput = {
  schoolId: string
  classId: string
  studentId: string
  date: string
  present: boolean
}

type BulkAttendanceInput = {
  schoolId: string
  classId: string
  date: string
  attendances: Array<{ studentId: string; present: boolean }>
}

type BulkGradeInput = {
  schoolId: string
  classId: string
  teacherId: string
  subjectId: string
  grades: Array<{
    studentId: string
    academicPeriodId: string
    assessmentId?: string | null
    value: number
  }>
  deleteGradeIds?: string[]
}

export async function registerGradeService(input: RegisterGradeInput) {
  validateGradeValue(input.value)

  const [schoolClass, student] = await Promise.all([
    getSchoolClassService(input.schoolId, input.classId),
    getStudentService(input.schoolId, input.studentId),
  ])

  if (!schoolClass) throw new Error('Class not found')
  if (!student) throw new Error('Student not found')

  return upsertGradeRepository({ ...input })
}

export async function registerBulkGradesService(input: BulkGradeInput) {
  const schoolClass = await getSchoolClassService(input.schoolId, input.classId)
  if (!schoolClass) throw new Error('Class not found')

  for (const grade of input.grades) {
    validateGradeValue(grade.value)
  }

  if (input.deleteGradeIds && input.deleteGradeIds.length > 0) {
    await deleteGradesByIdsRepository(input.schoolId, input.deleteGradeIds)
  }

  const rows = input.grades.map((grade) => ({
    schoolId: input.schoolId,
    classId: input.classId,
    teacherId: input.teacherId,
    subjectId: input.subjectId,
    studentId: grade.studentId,
    academicPeriodId: grade.academicPeriodId,
    assessmentId: grade.assessmentId ?? null,
    value: grade.value,
  }))

  return upsertBulkGradesRepository(rows)
}

export async function getClassAssessmentsService(
  schoolId: string,
  classId: string,
  subjectId?: string,
  academicPeriodId?: string,
) {
  const schoolClass = await getSchoolClassService(schoolId, classId)
  if (!schoolClass) throw new Error('Class not found')
  return findAssessmentsByClassRepository(schoolId, classId, subjectId, academicPeriodId)
}

export async function createAssessmentService(input: {
  schoolId: string
  classId: string
  subjectId: string
  academicPeriodId: string
  teacherId: string
  name: string
  weight: number
}) {
  const schoolClass = await getSchoolClassService(input.schoolId, input.classId)
  if (!schoolClass) throw new Error('Class not found')
  if (input.weight <= 0) throw new Error('Assessment weight must be positive')
  return createAssessmentRepository(input)
}

export async function updateAssessmentService(
  schoolId: string,
  id: string,
  data: { name?: string; weight?: number; order?: number },
) {
  const existing = await findAssessmentByIdRepository(schoolId, id)
  if (!existing) throw new Error('Assessment not found')
  if (data.weight !== undefined && data.weight <= 0) {
    throw new Error('Assessment weight must be positive')
  }
  return updateAssessmentRepository(schoolId, id, data)
}

export async function deleteAssessmentService(schoolId: string, id: string) {
  const existing = await findAssessmentByIdRepository(schoolId, id)
  if (!existing) throw new Error('Assessment not found')
  return deleteAssessmentRepository(schoolId, id)
}

export async function getClassPeriodGradeConfigsService(
  schoolId: string,
  classId: string,
  subjectId?: string,
) {
  const schoolClass = await getSchoolClassService(schoolId, classId)
  if (!schoolClass) throw new Error('Class not found')
  return findPeriodGradeConfigsByClassRepository(schoolId, classId, subjectId)
}

export async function upsertPeriodGradeConfigService(input: {
  schoolId: string
  classId: string
  subjectId: string
  academicPeriodId: string
  calculationMethod: GradeCalculationMethod
}) {
  const schoolClass = await getSchoolClassService(input.schoolId, input.classId)
  if (!schoolClass) throw new Error('Class not found')
  return upsertPeriodGradeConfigRepository(input)
}

export async function getStudentGradesService(schoolId: string, studentId: string) {
  const student = await getStudentService(schoolId, studentId)
  if (!student) throw new Error('Student not found')
  return findGradesByStudentRepository(schoolId, studentId)
}

export async function getClassGradesService(schoolId: string, classId: string) {
  const schoolClass = await getSchoolClassService(schoolId, classId)
  if (!schoolClass) throw new Error('Class not found')
  return findGradesByClassRepository(schoolId, classId)
}

export async function registerAttendanceService(input: RegisterAttendanceInput) {
  const [schoolClass, student] = await Promise.all([
    getSchoolClassService(input.schoolId, input.classId),
    getStudentService(input.schoolId, input.studentId),
  ])

  if (!schoolClass) throw new Error('Class not found')
  if (!student) throw new Error('Student not found')

  return upsertAttendanceRepository(input)
}

export async function registerBulkAttendanceService(input: BulkAttendanceInput) {
  return db.transaction(async (tx) => {
    const schoolClass = await getSchoolClassService(input.schoolId, input.classId)
    if (!schoolClass) throw new Error('Class not found')

    const rows = input.attendances.map((a) => ({
      schoolId: input.schoolId,
      classId: input.classId,
      studentId: a.studentId,
      date: input.date,
      present: a.present,
    }))

    return upsertBulkAttendanceRepository(rows)
  })
}

export async function getStudentAttendancesService(schoolId: string, studentId: string) {
  const student = await getStudentService(schoolId, studentId)
  if (!student) throw new Error('Student not found')
  return findAttendancesByStudentRepository(schoolId, studentId)
}

export async function getClassAttendanceByDateService(
  schoolId: string,
  classId: string,
  date: string,
) {
  const schoolClass = await getSchoolClassService(schoolId, classId)
  if (!schoolClass) throw new Error('Class not found')
  return findAttendancesByClassAndDateRepository(schoolId, classId, date)
}

// ─── Boletim completo ─────────────────────────────────────────────────────────
// Regras de negócio padronizadas da escola (P1 — FEATURES.md). Podem ser
// configuradas por escola no futuro (P3) sem mudar o contrato do endpoint.

export const PASSING_AVERAGE = 6
export const RECOVERY_MIN_AVERAGE = 3
export const MIN_ATTENDANCE_RATE = 75

function roundAverage(value: number): number {
  return Math.round(value * 100) / 100
}

function computeAverage(values: number[]): number | null {
  if (values.length === 0) return null
  const total = values.reduce((acc, value) => acc + value, 0)
  return roundAverage(total / values.length)
}

function subjectSituation(average: number | null, minPassingGrade = PASSING_AVERAGE): ReportSituation | null {
  if (average === null) return null
  if (average >= minPassingGrade) return 'approved'
  if (average >= RECOVERY_MIN_AVERAGE) return 'recovery'
  return 'failed'
}

function attendanceSummary(rows: StudentReportAttendanceRow[]): ReportAttendance {
  const totalCount = rows.length
  const presentCount = rows.filter((row) => row.present).length
  const rate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : null
  return { rate, presentCount, totalCount }
}

function overallSituation(
  subjects: SubjectReport[],
  attendance: ReportAttendance,
  minAttendancePercentage = MIN_ATTENDANCE_RATE,
): ReportSituation | null {
  if (subjects.length === 0) return null
  if (attendance.rate !== null && attendance.rate < minAttendancePercentage) return 'failed'
  if (subjects.some((subject) => subject.status === 'failed')) return 'failed'
  if (subjects.some((subject) => subject.status === 'recovery')) return 'recovery'
  return 'approved'
}

function computePeriodAverage(
  rows: StudentReportGradeRow[],
  method: GradeCalculationMethod,
): string {
  if (rows.length === 1 && !rows[0].assessmentId) {
    return rows[0].value
  }
  if (method === 'weighted') {
    let weightedSum = 0
    let totalWeight = 0
    for (const row of rows) {
      const val = parseFloat(row.value)
      const weight = parseFloat(row.assessmentWeight ?? '1')
      if (!Number.isNaN(val) && !Number.isNaN(weight) && weight > 0) {
        weightedSum += val * weight
        totalWeight += weight
      }
    }
    if (totalWeight > 0) {
      return roundAverage(weightedSum / totalWeight).toFixed(2)
    }
  }
  const avg = computeAverage(rows.map((r) => parseFloat(r.value)))
  return avg !== null ? avg.toFixed(2) : '0.00'
}

export async function getStudentReportService(
  schoolId: string,
  studentId: string,
): Promise<StudentReport> {
  const student = await getStudentService(schoolId, studentId)

  const [{ grades, attendances, configs = [] }, currentClass, school] = await Promise.all([
    findStudentReportDataRepository(schoolId, studentId),
    findStudentCurrentClassRepository(studentId),
    findSchoolByIdRepository(schoolId).catch(() => null),
  ])
  const minPassingGrade = school?.minPassingGrade ?? PASSING_AVERAGE
  const minAttendancePercentage = school?.minAttendancePercentage ?? MIN_ATTENDANCE_RATE

  const classSubjects = currentClass
    ? await findSubjectsByClassRepository(schoolId, currentClass.classId)
    : []

  const configMap = new Map<string, GradeCalculationMethod>()
  for (const cfg of configs) {
    configMap.set(
      `${cfg.classId}:${cfg.subjectId}:${cfg.academicPeriodId}`,
      cfg.calculationMethod === 'weighted' ? 'weighted' : 'simple',
    )
  }

  const periods = Array.from(
    grades.reduce((acc, grade) => {
      if (!acc.has(grade.academicPeriodId)) {
        acc.set(grade.academicPeriodId, {
          id: grade.academicPeriodId,
          name: grade.academicPeriodName ?? 'Período',
          order: grade.academicPeriodOrder ?? 0,
        })
      }
      return acc
    }, new Map<string, { id: string; name: string; order: number }>()).values(),
  ).sort((a, b) => a.order - b.order)

  // Group grades by subjectId -> academicPeriodId
  const gradesBySubjectPeriod = new Map<string, Map<string, StudentReportGradeRow[]>>()
  const subjectMeta = new Map<string, { subjectName: string; classId: string; className: string | null }>()

  for (const grade of grades) {
    if (!subjectMeta.has(grade.subjectId)) {
      subjectMeta.set(grade.subjectId, {
        subjectName: grade.subjectName ?? 'Disciplina',
        classId: grade.classId,
        className: grade.className,
      })
    }
    let byPeriod = gradesBySubjectPeriod.get(grade.subjectId)
    if (!byPeriod) {
      byPeriod = new Map()
      gradesBySubjectPeriod.set(grade.subjectId, byPeriod)
    }
    const list = byPeriod.get(grade.academicPeriodId) ?? []
    list.push(grade)
    byPeriod.set(grade.academicPeriodId, list)
  }

  const subjectsByKey = new Map<string, SubjectReport>()
  for (const [subjectId, byPeriod] of gradesBySubjectPeriod.entries()) {
    const meta = subjectMeta.get(subjectId)!
    const periodEntries: SubjectReport['grades'] = []

    for (const [academicPeriodId, periodRows] of byPeriod.entries()) {
      const first = periodRows[0]
      const method = configMap.get(`${first.classId}:${subjectId}:${academicPeriodId}`) ?? 'simple'
      periodEntries.push({
        academicPeriodId,
        academicPeriodName: first.academicPeriodName ?? 'Período',
        value: computePeriodAverage(periodRows, method),
      })
    }

    subjectsByKey.set(subjectId, {
      subjectId,
      subjectName: meta.subjectName,
      classId: meta.classId,
      className: meta.className,
      grades: periodEntries,
      average: null,
      status: null,
      attendance: null,
    })
  }

  for (const subject of classSubjects) {
    if (!subjectsByKey.has(subject.id)) {
      subjectsByKey.set(subject.id, {
        subjectId: subject.id,
        subjectName: subject.name,
        classId: currentClass?.classId ?? null,
        className: currentClass?.className ?? null,
        grades: [],
        average: null,
        status: null,
        attendance: null,
      })
    }
  }

  const subjects: SubjectReport[] = Array.from(subjectsByKey.values())
    .map((subject) => {
      const average = computeAverage(subject.grades.map((grade) => parseFloat(grade.value)))
      const subjectAttendances =
        subject.classId !== null
          ? attendances.filter((row) => row.classId === subject.classId)
          : attendances

      return {
        ...subject,
        average,
        status: subjectSituation(average, minPassingGrade),
        attendance: attendanceSummary(subjectAttendances),
      }
    })
    .sort((a, b) => a.subjectName.localeCompare(b.subjectName))

  const gradedSubjects = subjects.filter((subject) => subject.average !== null)
  const overallAttendance = attendanceSummary(attendances)

  const report: StudentReport = {
    studentId: student.id,
    studentName: student.name,
    enrollmentCode: student.enrollmentCode,
    periods,
    subjects,
    overall: {
      average: computeAverage(gradedSubjects.map((subject) => subject.average as number)),
      status: overallSituation(subjects, overallAttendance, minAttendancePercentage),
      attendance: overallAttendance,
      approvedSubjects: subjects.filter((subject) => subject.status === 'approved').length,
      totalSubjects: subjects.length,
    },
    approvalRules: {
      minPassingGrade,
      minAttendancePercentage,
    },
    generatedAt: new Date().toISOString(),
  }

  return report
}

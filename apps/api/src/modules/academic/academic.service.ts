import {
  upsertGradeRepository,
  findGradesByStudentRepository,
  findGradesByClassRepository,
  upsertAttendanceRepository,
  upsertBulkAttendanceRepository,
  findAttendancesByStudentRepository,
  findAttendancesByClassAndDateRepository,
  upsertBulkGradesRepository,
  findStudentReportDataRepository,
} from './academic.repository'
import type {
  StudentReportAttendanceRow,
} from './academic.repository'
import { getStudentService } from '../students/students.service'
import { getSchoolClassService } from '../classes/schoolClasses.service'
import { findStudentCurrentClassRepository } from '../classes/schoolClasses.repository'
import { findSubjectsByClassRepository } from '../timetable/timetable.repository'
import { validateGradeValue } from '../../lib/validators'
import type {
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
  grades: Array<{ studentId: string; academicPeriodId: string; value: number }>
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

  const rows = input.grades.map((grade) => ({
    schoolId: input.schoolId,
    classId: input.classId,
    teacherId: input.teacherId,
    subjectId: input.subjectId,
    studentId: grade.studentId,
    academicPeriodId: grade.academicPeriodId,
    value: grade.value,
  }))

  return upsertBulkGradesRepository(rows)
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

export const PASSING_AVERAGE = 5
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

function subjectSituation(average: number | null): ReportSituation | null {
  if (average === null) return null
  if (average >= PASSING_AVERAGE) return 'approved'
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
): ReportSituation | null {
  if (subjects.length === 0) return null
  if (attendance.rate !== null && attendance.rate < MIN_ATTENDANCE_RATE) return 'failed'
  if (subjects.some((subject) => subject.status === 'failed')) return 'failed'
  if (subjects.some((subject) => subject.status === 'recovery')) return 'recovery'
  return 'approved'
}

export async function getStudentReportService(
  schoolId: string,
  studentId: string,
): Promise<StudentReport> {
  const student = await getStudentService(schoolId, studentId)

  const [{ grades, attendances }, currentClass] = await Promise.all([
    findStudentReportDataRepository(schoolId, studentId),
    findStudentCurrentClassRepository(studentId),
  ])

  const classSubjects = currentClass
    ? await findSubjectsByClassRepository(schoolId, currentClass.classId)
    : []

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

  const subjectsByKey = new Map<string, SubjectReport>()
  for (const grade of grades) {
    const existing = subjectsByKey.get(grade.subjectId)
    const gradeEntry = {
      academicPeriodId: grade.academicPeriodId,
      academicPeriodName: grade.academicPeriodName ?? 'Período',
      value: grade.value,
    }
    if (existing) {
      existing.grades.push(gradeEntry)
    } else {
      subjectsByKey.set(grade.subjectId, {
        subjectId: grade.subjectId,
        subjectName: grade.subjectName ?? 'Disciplina',
        classId: grade.classId,
        className: grade.className,
        grades: [gradeEntry],
        average: null,
        status: null,
        attendance: null,
      })
    }
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
        status: subjectSituation(average),
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
      status: overallSituation(subjects, overallAttendance),
      attendance: overallAttendance,
      approvedSubjects: subjects.filter((subject) => subject.status === 'approved').length,
      totalSubjects: subjects.length,
    },
    generatedAt: new Date().toISOString(),
  }

  return report
}

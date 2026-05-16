import {
  upsertGradeRepository,
  findGradesByStudentRepository,
  findGradesByClassRepository,
  upsertAttendanceRepository,
  upsertBulkAttendanceRepository,
  findAttendancesByStudentRepository,
  findAttendancesByClassAndDateRepository,
} from './academic.repository'
import { getStudentService } from '../students/students.service'
import { getSchoolClassService } from '../classes/schoolClasses.service'
import { validateGradeValue } from '../../lib/validators'

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

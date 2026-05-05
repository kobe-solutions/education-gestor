import {
  upsertGradeRepository,
  findGradesByStudentRepository,
  findGradesByClassRepository,
  upsertAttendanceRepository,
  findAttendancesByStudentRepository,
  findAttendancesByClassAndDateRepository,
} from './academic.repository'
import { findStudentByIdRepository } from '../students/students.repository'
import { findSchoolClassByIdRepository } from '../classes/schoolClasses.repository'

type RegisterGradeInput = {
  schoolId: string
  classId: string
  studentId: string
  teacherId: string
  subject: string
  value: number
  period: string
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
  const [schoolClass, student] = await Promise.all([
    findSchoolClassByIdRepository(input.schoolId, input.classId),
    findStudentByIdRepository(input.schoolId, input.studentId),
  ])

  if (!schoolClass) throw new Error('Class not found')
  if (!student) throw new Error('Student not found')

  return upsertGradeRepository({ ...input, value: input.value.toString() })
}

export async function getStudentGradesService(schoolId: string, studentId: string) {
  const student = await findStudentByIdRepository(schoolId, studentId)
  if (!student) throw new Error('Student not found')
  return findGradesByStudentRepository(schoolId, studentId)
}

export async function getClassGradesService(schoolId: string, classId: string) {
  const schoolClass = await findSchoolClassByIdRepository(schoolId, classId)
  if (!schoolClass) throw new Error('Class not found')
  return findGradesByClassRepository(schoolId, classId)
}

export async function registerAttendanceService(input: RegisterAttendanceInput) {
  const [schoolClass, student] = await Promise.all([
    findSchoolClassByIdRepository(input.schoolId, input.classId),
    findStudentByIdRepository(input.schoolId, input.studentId),
  ])

  if (!schoolClass) throw new Error('Class not found')
  if (!student) throw new Error('Student not found')

  return upsertAttendanceRepository(input)
}

export async function registerBulkAttendanceService(input: BulkAttendanceInput) {
  const schoolClass = await findSchoolClassByIdRepository(input.schoolId, input.classId)
  if (!schoolClass) throw new Error('Class not found')

  return Promise.all(
    input.attendances.map((a) =>
      upsertAttendanceRepository({
        schoolId: input.schoolId,
        classId: input.classId,
        studentId: a.studentId,
        date: input.date,
        present: a.present,
      }),
    ),
  )
}

export async function getStudentAttendancesService(schoolId: string, studentId: string) {
  const student = await findStudentByIdRepository(schoolId, studentId)
  if (!student) throw new Error('Student not found')
  return findAttendancesByStudentRepository(schoolId, studentId)
}

export async function getClassAttendanceByDateService(
  schoolId: string,
  classId: string,
  date: string,
) {
  const schoolClass = await findSchoolClassByIdRepository(schoolId, classId)
  if (!schoolClass) throw new Error('Class not found')
  return findAttendancesByClassAndDateRepository(schoolId, classId, date)
}

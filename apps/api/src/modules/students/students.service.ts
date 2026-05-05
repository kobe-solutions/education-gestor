import {
  findAllStudentsRepository,
  findStudentByIdRepository,
  findStudentByEnrollmentCodeRepository,
  createStudentRepository,
  updateStudentRepository,
  deleteStudentRepository,
  createGuardianRepository,
  findGuardiansByStudentIdRepository,
} from './students.repository'

type CreateStudentServiceInput = {
  schoolId: string
  name: string
  email?: string
  birthDate?: string
  enrollmentCode: string
}

type UpdateStudentServiceInput = {
  name?: string
  email?: string
  birthDate?: string
  enrollmentCode?: string
}

type CreateGuardianServiceInput = {
  studentId: string
  schoolId: string
  name: string
  phone?: string
  relationship: string
}

export async function listStudentsService(schoolId: string) {
  return findAllStudentsRepository(schoolId)
}

export async function getStudentService(schoolId: string, id: string) {
  const student = await findStudentByIdRepository(schoolId, id)
  if (!student) throw new Error('Student not found')
  return student
}

export async function createStudentService(input: CreateStudentServiceInput) {
  const existing = await findStudentByEnrollmentCodeRepository(input.schoolId, input.enrollmentCode)
  if (existing) throw new Error('Enrollment code already in use')

  return createStudentRepository({
    schoolId: input.schoolId,
    name: input.name.trim(),
    email: input.email?.toLowerCase().trim(),
    birthDate: input.birthDate,
    enrollmentCode: input.enrollmentCode.trim(),
  })
}

export async function updateStudentService(
  schoolId: string,
  id: string,
  input: UpdateStudentServiceInput,
) {
  const student = await findStudentByIdRepository(schoolId, id)
  if (!student) throw new Error('Student not found')

  if (input.enrollmentCode && input.enrollmentCode !== student.enrollmentCode) {
    const existing = await findStudentByEnrollmentCodeRepository(schoolId, input.enrollmentCode)
    if (existing) throw new Error('Enrollment code already in use')
  }

  const updated = await updateStudentRepository(schoolId, id, input)
  if (!updated) throw new Error('Student not found')
  return updated
}

export async function deleteStudentService(schoolId: string, id: string) {
  const student = await findStudentByIdRepository(schoolId, id)
  if (!student) throw new Error('Student not found')
  await deleteStudentRepository(schoolId, id)
}

export async function addGuardianService(input: CreateGuardianServiceInput) {
  const student = await findStudentByIdRepository(input.schoolId, input.studentId)
  if (!student) throw new Error('Student not found')

  return createGuardianRepository({
    studentId: input.studentId,
    name: input.name.trim(),
    phone: input.phone?.trim(),
    relationship: input.relationship.trim(),
  })
}

export async function listGuardiansService(schoolId: string, studentId: string) {
  const student = await findStudentByIdRepository(schoolId, studentId)
  if (!student) throw new Error('Student not found')
  return findGuardiansByStudentIdRepository(studentId)
}

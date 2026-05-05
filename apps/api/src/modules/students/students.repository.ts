import { eq, and } from 'drizzle-orm'
import { db } from '../../db'
import { students, guardians } from '../../db/schema'

type CreateStudentRepositoryInput = {
  schoolId: string
  name: string
  email?: string
  birthDate?: string
  enrollmentCode: string
}

type UpdateStudentRepositoryInput = {
  name?: string
  email?: string
  birthDate?: string
  enrollmentCode?: string
}

type CreateGuardianRepositoryInput = {
  studentId: string
  name: string
  phone?: string
  relationship: string
}

export async function findAllStudentsRepository(schoolId: string) {
  return db
    .select({
      id: students.id,
      schoolId: students.schoolId,
      name: students.name,
      email: students.email,
      birthDate: students.birthDate,
      enrollmentCode: students.enrollmentCode,
      createdAt: students.createdAt,
      updatedAt: students.updatedAt,
    })
    .from(students)
    .where(eq(students.schoolId, schoolId))
}

export async function findStudentByIdRepository(schoolId: string, id: string) {
  const [student] = await db
    .select({
      id: students.id,
      schoolId: students.schoolId,
      name: students.name,
      email: students.email,
      birthDate: students.birthDate,
      enrollmentCode: students.enrollmentCode,
      createdAt: students.createdAt,
      updatedAt: students.updatedAt,
    })
    .from(students)
    .where(and(eq(students.schoolId, schoolId), eq(students.id, id)))
    .limit(1)

  return student
}

export async function findStudentByEnrollmentCodeRepository(schoolId: string, enrollmentCode: string) {
  const [student] = await db
    .select({ id: students.id })
    .from(students)
    .where(and(eq(students.schoolId, schoolId), eq(students.enrollmentCode, enrollmentCode)))
    .limit(1)

  return student
}

export async function createStudentRepository(input: CreateStudentRepositoryInput) {
  const [student] = await db
    .insert(students)
    .values({
      schoolId: input.schoolId,
      name: input.name,
      email: input.email,
      birthDate: input.birthDate,
      enrollmentCode: input.enrollmentCode,
    })
    .returning({
      id: students.id,
      schoolId: students.schoolId,
      name: students.name,
      email: students.email,
      birthDate: students.birthDate,
      enrollmentCode: students.enrollmentCode,
      createdAt: students.createdAt,
      updatedAt: students.updatedAt,
    })

  return student
}

export async function updateStudentRepository(
  schoolId: string,
  id: string,
  input: UpdateStudentRepositoryInput,
) {
  const [student] = await db
    .update(students)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(students.schoolId, schoolId), eq(students.id, id)))
    .returning({
      id: students.id,
      schoolId: students.schoolId,
      name: students.name,
      email: students.email,
      birthDate: students.birthDate,
      enrollmentCode: students.enrollmentCode,
      createdAt: students.createdAt,
      updatedAt: students.updatedAt,
    })

  return student
}

export async function deleteStudentRepository(schoolId: string, id: string) {
  await db
    .delete(students)
    .where(and(eq(students.schoolId, schoolId), eq(students.id, id)))
}

export async function createGuardianRepository(input: CreateGuardianRepositoryInput) {
  const [guardian] = await db
    .insert(guardians)
    .values({
      studentId: input.studentId,
      name: input.name,
      phone: input.phone,
      relationship: input.relationship,
    })
    .returning({
      id: guardians.id,
      studentId: guardians.studentId,
      name: guardians.name,
      phone: guardians.phone,
      relationship: guardians.relationship,
      createdAt: guardians.createdAt,
    })

  return guardian
}

export async function findGuardiansByStudentIdRepository(studentId: string) {
  return db
    .select({
      id: guardians.id,
      studentId: guardians.studentId,
      name: guardians.name,
      phone: guardians.phone,
      relationship: guardians.relationship,
      createdAt: guardians.createdAt,
    })
    .from(guardians)
    .where(eq(guardians.studentId, studentId))
}

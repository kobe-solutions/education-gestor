import { eq, and } from 'drizzle-orm'
import { db } from '../../db'
import { teachers } from '../../db/schema'

type CreateTeacherRepositoryInput = {
  schoolId: string
  name: string
  email: string
  passwordHash: string
  role: 'professor'
}

export async function createTeacherRepository(input: CreateTeacherRepositoryInput) {
  const [teacher] = await db
    .insert(teachers)
    .values({
      schoolId: input.schoolId,
      name: input.name,
      email: input.email,
      passwordHash: input.passwordHash,
      role: input.role,
    })
    .returning({
      id: teachers.id,
      schoolId: teachers.schoolId,
      name: teachers.name,
      email: teachers.email,
      role: teachers.role,
      createdAt: teachers.createdAt,
    })

  return teacher
}

export async function findTeacherByEmailRepository(schoolId: string, email: string) {
  const [teacher] = await db
    .select({
      id: teachers.id,
    })
    .from(teachers)
    .where(and(eq(teachers.schoolId, schoolId), eq(teachers.email, email)))
    .limit(1)

  return teacher
}

export async function findTeacherForAuthRepository(schoolId: string, email: string) {
  const [teacher] = await db
    .select({
      id: teachers.id,
      schoolId: teachers.schoolId,
      email: teachers.email,
      passwordHash: teachers.passwordHash,
      role: teachers.role,
    })
    .from(teachers)
    .where(and(eq(teachers.schoolId, schoolId), eq(teachers.email, email)))
    .limit(1)

  return teacher
}

export async function findAllTeachersRepository(schoolId: string) {
  return db
    .select({
      id: teachers.id,
      schoolId: teachers.schoolId,
      name: teachers.name,
      email: teachers.email,
      role: teachers.role,
      createdAt: teachers.createdAt,
      updatedAt: teachers.updatedAt,
    })
    .from(teachers)
    .where(eq(teachers.schoolId, schoolId))
}

export async function findTeacherByIdRepository(schoolId: string, id: string) {
  const [teacher] = await db
    .select({
      id: teachers.id,
      schoolId: teachers.schoolId,
      name: teachers.name,
      email: teachers.email,
      role: teachers.role,
      createdAt: teachers.createdAt,
      updatedAt: teachers.updatedAt,
    })
    .from(teachers)
    .where(and(eq(teachers.schoolId, schoolId), eq(teachers.id, id)))
    .limit(1)

  return teacher
}

export async function updateTeacherRepository(
  schoolId: string,
  id: string,
  input: { name?: string; email?: string },
) {
  const [teacher] = await db
    .update(teachers)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(teachers.schoolId, schoolId), eq(teachers.id, id)))
    .returning({
      id: teachers.id,
      schoolId: teachers.schoolId,
      name: teachers.name,
      email: teachers.email,
      role: teachers.role,
      createdAt: teachers.createdAt,
      updatedAt: teachers.updatedAt,
    })

  return teacher
}

export async function deleteTeacherRepository(schoolId: string, id: string) {
  await db.delete(teachers).where(and(eq(teachers.schoolId, schoolId), eq(teachers.id, id)))
}

export async function findTeachersByEmailRepository(email: string) {
  const teachersFound = await db
    .select({
      id: teachers.id,
      schoolId: teachers.schoolId,
      email: teachers.email,
      passwordHash: teachers.passwordHash,
      role: teachers.role,
    })
    .from(teachers)
    .where(eq(teachers.email, email))

  return teachersFound
}

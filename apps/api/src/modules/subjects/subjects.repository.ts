import { and, eq } from 'drizzle-orm'
import { db } from '../../db'
import { subjects } from '../../db/schema'

type CreateSubjectRepositoryInput = {
  schoolId: string
  name: string
  code: string | null
  weeklyHours: number
}

export async function createSubjectRepository(input: CreateSubjectRepositoryInput) {
  const [subject] = await db
    .insert(subjects)
    .values({
      schoolId: input.schoolId,
      name: input.name,
      code: input.code,
      weeklyHours: input.weeklyHours,
    })
    .returning({
      id: subjects.id,
      schoolId: subjects.schoolId,
      name: subjects.name,
      code: subjects.code,
      weeklyHours: subjects.weeklyHours,
      createdAt: subjects.createdAt,
    })

  return subject
}

export async function findSubjectByNameRepository(schoolId: string, name: string) {
  const [subject] = await db
    .select({ id: subjects.id })
    .from(subjects)
    .where(and(eq(subjects.schoolId, schoolId), eq(subjects.name, name)))
    .limit(1)

  return subject
}

export async function findSubjectByCodeRepository(schoolId: string, code: string) {
  const [subject] = await db
    .select({ id: subjects.id })
    .from(subjects)
    .where(and(eq(subjects.schoolId, schoolId), eq(subjects.code, code)))
    .limit(1)

  return subject
}

export async function listSubjectsRepository(schoolId: string) {
  return db
    .select({
      id: subjects.id,
      schoolId: subjects.schoolId,
      name: subjects.name,
      code: subjects.code,
      weeklyHours: subjects.weeklyHours,
      createdAt: subjects.createdAt,
    })
    .from(subjects)
    .where(eq(subjects.schoolId, schoolId))
}

export async function findSubjectByIdRepository(schoolId: string, id: string) {
  const [subject] = await db
    .select({
      id: subjects.id,
      schoolId: subjects.schoolId,
      name: subjects.name,
      code: subjects.code,
      weeklyHours: subjects.weeklyHours,
      createdAt: subjects.createdAt,
    })
    .from(subjects)
    .where(and(eq(subjects.schoolId, schoolId), eq(subjects.id, id)))
    .limit(1)

  return subject
}

export async function updateSubjectRepository(
  schoolId: string,
  id: string,
  input: { name?: string; code?: string | null; weeklyHours?: number },
) {
  const [subject] = await db
    .update(subjects)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(subjects.schoolId, schoolId), eq(subjects.id, id)))
    .returning({
      id: subjects.id,
      schoolId: subjects.schoolId,
      name: subjects.name,
      code: subjects.code,
      weeklyHours: subjects.weeklyHours,
      createdAt: subjects.createdAt,
    })

  return subject
}

export async function deleteSubjectRepository(schoolId: string, id: string) {
  await db.delete(subjects).where(and(eq(subjects.schoolId, schoolId), eq(subjects.id, id)))
}

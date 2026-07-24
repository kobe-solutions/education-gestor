import { and, eq } from 'drizzle-orm'
import { db } from '../../db'
import { educationLevels } from '../../db/schema'

const levelFields = {
  id: educationLevels.id,
  schoolId: educationLevels.schoolId,
  type: educationLevels.type,
  modality: educationLevels.modality,
  name: educationLevels.name,
  active: educationLevels.active,
  createdAt: educationLevels.createdAt,
}

type CreateInput = {
  schoolId: string
  type: string
  modality?: string | null
  name: string
  active?: boolean
}

export async function createEducationLevelRepository(input: CreateInput) {
  const [level] = await db
    .insert(educationLevels)
    .values({
      schoolId: input.schoolId,
      type: input.type,
      modality: input.modality ?? null,
      name: input.name,
      active: input.active ?? true,
    })
    .returning(levelFields)

  return level
}

export async function listEducationLevelsRepository(schoolId: string) {
  return db.select(levelFields).from(educationLevels).where(eq(educationLevels.schoolId, schoolId))
}

export async function findEducationLevelByIdRepository(schoolId: string, id: string) {
  const [level] = await db
    .select(levelFields)
    .from(educationLevels)
    .where(and(eq(educationLevels.schoolId, schoolId), eq(educationLevels.id, id)))
    .limit(1)

  return level
}

export async function findEducationLevelByNameRepository(schoolId: string, name: string) {
  const [level] = await db
    .select({ id: educationLevels.id })
    .from(educationLevels)
    .where(and(eq(educationLevels.schoolId, schoolId), eq(educationLevels.name, name)))
    .limit(1)

  return level
}

export async function updateEducationLevelRepository(
  schoolId: string,
  id: string,
  input: { type?: string; modality?: string | null; name?: string; active?: boolean },
) {
  const [level] = await db
    .update(educationLevels)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(educationLevels.schoolId, schoolId), eq(educationLevels.id, id)))
    .returning(levelFields)

  return level
}

export async function deleteEducationLevelRepository(schoolId: string, id: string) {
  await db
    .delete(educationLevels)
    .where(and(eq(educationLevels.schoolId, schoolId), eq(educationLevels.id, id)))
}

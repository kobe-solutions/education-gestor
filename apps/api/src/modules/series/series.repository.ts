import { and, eq } from 'drizzle-orm'
import { db } from '../../db'
import { series, educationLevels } from '../../db/schema'

const serieFields = {
  id: series.id,
  schoolId: series.schoolId,
  educationLevelId: series.educationLevelId,
  name: series.name,
  order: series.order,
  createdAt: series.createdAt,
}

type CreateInput = {
  schoolId: string
  educationLevelId: string
  name: string
  order?: number
}

export async function createSerieRepository(input: CreateInput) {
  const [serie] = await db
    .insert(series)
    .values({
      schoolId: input.schoolId,
      educationLevelId: input.educationLevelId,
      name: input.name,
      order: input.order ?? 0,
    })
    .returning(serieFields)

  return serie
}

export async function listSeriesRepository(schoolId: string, educationLevelId?: string) {
  const conditions = educationLevelId
    ? and(eq(series.schoolId, schoolId), eq(series.educationLevelId, educationLevelId))
    : eq(series.schoolId, schoolId)

  return db
    .select({
      ...serieFields,
      educationLevel: {
        id: educationLevels.id,
        name: educationLevels.name,
        type: educationLevels.type,
      },
    })
    .from(series)
    .leftJoin(educationLevels, eq(series.educationLevelId, educationLevels.id))
    .where(conditions)
    .orderBy(series.order)
}

export async function findSerieByIdRepository(schoolId: string, id: string) {
  const [serie] = await db
    .select({
      ...serieFields,
      educationLevel: {
        id: educationLevels.id,
        name: educationLevels.name,
        type: educationLevels.type,
      },
    })
    .from(series)
    .leftJoin(educationLevels, eq(series.educationLevelId, educationLevels.id))
    .where(and(eq(series.schoolId, schoolId), eq(series.id, id)))
    .limit(1)

  return serie
}

export async function findSerieByNameInLevelRepository(
  schoolId: string,
  educationLevelId: string,
  name: string,
) {
  const [serie] = await db
    .select({ id: series.id })
    .from(series)
    .where(
      and(
        eq(series.schoolId, schoolId),
        eq(series.educationLevelId, educationLevelId),
        eq(series.name, name),
      ),
    )
    .limit(1)

  return serie
}

export async function updateSerieRepository(
  schoolId: string,
  id: string,
  input: { name?: string; order?: number },
) {
  const [serie] = await db
    .update(series)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(series.schoolId, schoolId), eq(series.id, id)))
    .returning(serieFields)

  return serie
}

export async function deleteSerieRepository(schoolId: string, id: string) {
  await db.delete(series).where(and(eq(series.schoolId, schoolId), eq(series.id, id)))
}

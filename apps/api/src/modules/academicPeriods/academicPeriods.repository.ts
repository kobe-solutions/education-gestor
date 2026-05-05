import { eq, and } from 'drizzle-orm'
import { db } from '../../db'
import { academicPeriods } from '../../db/schema'

type CreateAcademicPeriodRepositoryInput = {
  schoolId: string
  name: string
  startDate: string
  endDate: string
}

type UpdateAcademicPeriodRepositoryInput = {
  name?: string
  startDate?: string
  endDate?: string
  active?: boolean
}

export async function findAllAcademicPeriodsRepository(schoolId: string) {
  return db
    .select({
      id: academicPeriods.id,
      schoolId: academicPeriods.schoolId,
      name: academicPeriods.name,
      startDate: academicPeriods.startDate,
      endDate: academicPeriods.endDate,
      active: academicPeriods.active,
      createdAt: academicPeriods.createdAt,
      updatedAt: academicPeriods.updatedAt,
    })
    .from(academicPeriods)
    .where(eq(academicPeriods.schoolId, schoolId))
}

export async function findAcademicPeriodByIdRepository(schoolId: string, id: string) {
  const [period] = await db
    .select({
      id: academicPeriods.id,
      schoolId: academicPeriods.schoolId,
      name: academicPeriods.name,
      startDate: academicPeriods.startDate,
      endDate: academicPeriods.endDate,
      active: academicPeriods.active,
      createdAt: academicPeriods.createdAt,
      updatedAt: academicPeriods.updatedAt,
    })
    .from(academicPeriods)
    .where(and(eq(academicPeriods.schoolId, schoolId), eq(academicPeriods.id, id)))
    .limit(1)

  return period
}

export async function createAcademicPeriodRepository(input: CreateAcademicPeriodRepositoryInput) {
  const [period] = await db
    .insert(academicPeriods)
    .values({
      schoolId: input.schoolId,
      name: input.name,
      startDate: input.startDate,
      endDate: input.endDate,
    })
    .returning({
      id: academicPeriods.id,
      schoolId: academicPeriods.schoolId,
      name: academicPeriods.name,
      startDate: academicPeriods.startDate,
      endDate: academicPeriods.endDate,
      active: academicPeriods.active,
      createdAt: academicPeriods.createdAt,
      updatedAt: academicPeriods.updatedAt,
    })

  return period
}

export async function updateAcademicPeriodRepository(
  schoolId: string,
  id: string,
  input: UpdateAcademicPeriodRepositoryInput,
) {
  const [period] = await db
    .update(academicPeriods)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(academicPeriods.schoolId, schoolId), eq(academicPeriods.id, id)))
    .returning({
      id: academicPeriods.id,
      schoolId: academicPeriods.schoolId,
      name: academicPeriods.name,
      startDate: academicPeriods.startDate,
      endDate: academicPeriods.endDate,
      active: academicPeriods.active,
      createdAt: academicPeriods.createdAt,
      updatedAt: academicPeriods.updatedAt,
    })

  return period
}

export async function deleteAcademicPeriodRepository(schoolId: string, id: string) {
  await db
    .delete(academicPeriods)
    .where(and(eq(academicPeriods.schoolId, schoolId), eq(academicPeriods.id, id)))
}

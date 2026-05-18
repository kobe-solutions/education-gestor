import { eq, and, asc } from 'drizzle-orm'
import { db } from '../../db'
import { classPeriods } from '../../db/schema'

type CreateInput = {
  schoolId: string
  name: string
  startTime: string
  endTime: string
  order: number
}

type UpdateInput = {
  name?: string
  startTime?: string
  endTime?: string
  order?: number
}

const baseSelect = {
  id: classPeriods.id,
  schoolId: classPeriods.schoolId,
  name: classPeriods.name,
  startTime: classPeriods.startTime,
  endTime: classPeriods.endTime,
  order: classPeriods.order,
  createdAt: classPeriods.createdAt,
  updatedAt: classPeriods.updatedAt,
}

export async function findAllClassPeriodsRepository(schoolId: string) {
  return db
    .select(baseSelect)
    .from(classPeriods)
    .where(eq(classPeriods.schoolId, schoolId))
    .orderBy(asc(classPeriods.order))
}

export async function findClassPeriodByIdRepository(schoolId: string, id: string) {
  const [period] = await db
    .select(baseSelect)
    .from(classPeriods)
    .where(and(eq(classPeriods.schoolId, schoolId), eq(classPeriods.id, id)))
    .limit(1)

  return period
}

export async function createClassPeriodRepository(input: CreateInput) {
  const [period] = await db.insert(classPeriods).values(input).returning(baseSelect)
  return period
}

export async function updateClassPeriodRepository(schoolId: string, id: string, input: UpdateInput) {
  const [period] = await db
    .update(classPeriods)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(classPeriods.schoolId, schoolId), eq(classPeriods.id, id)))
    .returning(baseSelect)

  return period
}

export async function deleteClassPeriodRepository(schoolId: string, id: string) {
  await db
    .delete(classPeriods)
    .where(and(eq(classPeriods.schoolId, schoolId), eq(classPeriods.id, id)))
}

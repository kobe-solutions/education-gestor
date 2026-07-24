import { eq, and } from 'drizzle-orm'
import { db } from '../../db'
import { academicPeriods } from '../../db/schema'

type CreateAcademicPeriodInput = {
  schoolId: string
  academicYearId: string
  name: string
  type: string
  order: number
  startDate: string
  endDate: string
  gradeClosingDate?: string
}

type UpdateAcademicPeriodInput = {
  name?: string
  type?: string
  order?: number
  startDate?: string
  endDate?: string
  gradeClosingDate?: string | null
}

const baseSelect = {
  id: academicPeriods.id,
  schoolId: academicPeriods.schoolId,
  academicYearId: academicPeriods.academicYearId,
  name: academicPeriods.name,
  type: academicPeriods.type,
  order: academicPeriods.order,
  startDate: academicPeriods.startDate,
  endDate: academicPeriods.endDate,
  gradeClosingDate: academicPeriods.gradeClosingDate,
  createdAt: academicPeriods.createdAt,
  updatedAt: academicPeriods.updatedAt,
}

export async function findAllAcademicPeriodsRepository(schoolId: string, academicYearId: string) {
  return db
    .select(baseSelect)
    .from(academicPeriods)
    .where(
      and(
        eq(academicPeriods.schoolId, schoolId),
        eq(academicPeriods.academicYearId, academicYearId),
      ),
    )
}

export async function findAcademicPeriodByIdRepository(
  schoolId: string,
  academicYearId: string,
  id: string,
) {
  const [period] = await db
    .select(baseSelect)
    .from(academicPeriods)
    .where(
      and(
        eq(academicPeriods.schoolId, schoolId),
        eq(academicPeriods.academicYearId, academicYearId),
        eq(academicPeriods.id, id),
      ),
    )
    .limit(1)

  return period
}

export async function createAcademicPeriodRepository(input: CreateAcademicPeriodInput) {
  const [period] = await db.insert(academicPeriods).values(input).returning(baseSelect)
  return period
}

export async function updateAcademicPeriodRepository(
  schoolId: string,
  academicYearId: string,
  id: string,
  input: UpdateAcademicPeriodInput,
) {
  const [period] = await db
    .update(academicPeriods)
    .set({ ...input, updatedAt: new Date() })
    .where(
      and(
        eq(academicPeriods.schoolId, schoolId),
        eq(academicPeriods.academicYearId, academicYearId),
        eq(academicPeriods.id, id),
      ),
    )
    .returning(baseSelect)

  return period
}

export async function deleteAcademicPeriodRepository(
  schoolId: string,
  academicYearId: string,
  id: string,
) {
  await db
    .delete(academicPeriods)
    .where(
      and(
        eq(academicPeriods.schoolId, schoolId),
        eq(academicPeriods.academicYearId, academicYearId),
        eq(academicPeriods.id, id),
      ),
    )
}

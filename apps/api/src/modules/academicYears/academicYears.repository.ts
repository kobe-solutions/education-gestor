import { eq, and } from 'drizzle-orm'
import { db } from '../../db'
import { academicYears } from '../../db/schema'

type CreateAcademicYearInput = {
  schoolId: string
  year: number
  name: string
  startDate: string
  endDate: string
  registrationStart?: string
  registrationEnd?: string
}

type UpdateAcademicYearInput = {
  name?: string
  startDate?: string
  endDate?: string
  registrationStart?: string | null
  registrationEnd?: string | null
}

const baseSelect = {
  id: academicYears.id,
  schoolId: academicYears.schoolId,
  year: academicYears.year,
  name: academicYears.name,
  startDate: academicYears.startDate,
  endDate: academicYears.endDate,
  registrationStart: academicYears.registrationStart,
  registrationEnd: academicYears.registrationEnd,
  status: academicYears.status,
  createdAt: academicYears.createdAt,
  updatedAt: academicYears.updatedAt,
}

export async function findAllAcademicYearsRepository(schoolId: string) {
  return db.select(baseSelect).from(academicYears).where(eq(academicYears.schoolId, schoolId))
}

export async function findAcademicYearByIdRepository(schoolId: string, id: string) {
  const [year] = await db
    .select(baseSelect)
    .from(academicYears)
    .where(and(eq(academicYears.schoolId, schoolId), eq(academicYears.id, id)))
    .limit(1)

  return year
}

export async function findActiveAcademicYearRepository(schoolId: string) {
  const [year] = await db
    .select(baseSelect)
    .from(academicYears)
    .where(and(eq(academicYears.schoolId, schoolId), eq(academicYears.status, 'active')))
    .limit(1)

  return year
}

export async function createAcademicYearRepository(input: CreateAcademicYearInput) {
  const [year] = await db
    .insert(academicYears)
    .values(input)
    .returning(baseSelect)

  return year
}

export async function updateAcademicYearRepository(
  schoolId: string,
  id: string,
  input: UpdateAcademicYearInput,
) {
  const [year] = await db
    .update(academicYears)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(academicYears.schoolId, schoolId), eq(academicYears.id, id)))
    .returning(baseSelect)

  return year
}

export async function updateAcademicYearStatusRepository(
  schoolId: string,
  id: string,
  status: string,
) {
  const [year] = await db
    .update(academicYears)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(academicYears.schoolId, schoolId), eq(academicYears.id, id)))
    .returning(baseSelect)

  return year
}

export async function deleteAcademicYearRepository(schoolId: string, id: string) {
  await db
    .delete(academicYears)
    .where(and(eq(academicYears.schoolId, schoolId), eq(academicYears.id, id)))
}

import {
  findAllAcademicPeriodsRepository,
  findAcademicPeriodByIdRepository,
  createAcademicPeriodRepository,
  updateAcademicPeriodRepository,
  deleteAcademicPeriodRepository,
} from './academicPeriods.repository'
import type { CreateAcademicPeriodBody, UpdateAcademicPeriodBody } from './academicPeriods.schema'
import { validateNoPeriodOverlap } from '../../lib/validators'

export async function listAcademicPeriodsService(schoolId: string, academicYearId: string) {
  return findAllAcademicPeriodsRepository(schoolId, academicYearId)
}

export async function getAcademicPeriodService(
  schoolId: string,
  academicYearId: string,
  id: string,
) {
  const period = await findAcademicPeriodByIdRepository(schoolId, academicYearId, id)
  if (!period) throw new Error('Academic period not found')
  return period
}

export async function createAcademicPeriodService(
  schoolId: string,
  academicYearId: string,
  body: CreateAcademicPeriodBody,
) {
  const existingPeriods = await findAllAcademicPeriodsRepository(schoolId, academicYearId)
  validateNoPeriodOverlap(body.startDate, body.endDate, existingPeriods)

  return createAcademicPeriodRepository({
    schoolId,
    academicYearId,
    name: body.name.trim(),
    type: body.type,
    order: body.order,
    startDate: body.startDate,
    endDate: body.endDate,
    gradeClosingDate: body.gradeClosingDate,
  })
}

export async function updateAcademicPeriodService(
  schoolId: string,
  academicYearId: string,
  id: string,
  body: UpdateAcademicPeriodBody,
) {
  const existing = await findAcademicPeriodByIdRepository(schoolId, academicYearId, id)
  if (!existing) throw new Error('Academic period not found')

  const startDate = body.startDate ?? existing.startDate
  const endDate = body.endDate ?? existing.endDate

  const existingPeriods = await findAllAcademicPeriodsRepository(schoolId, academicYearId)
  validateNoPeriodOverlap(startDate, endDate, existingPeriods, id)

  const updated = await updateAcademicPeriodRepository(schoolId, academicYearId, id, {
    ...body,
    name: body.name?.trim(),
  })
  if (!updated) throw new Error('Academic period not found')
  return updated
}

export async function deleteAcademicPeriodService(
  schoolId: string,
  academicYearId: string,
  id: string,
) {
  const existing = await findAcademicPeriodByIdRepository(schoolId, academicYearId, id)
  if (!existing) throw new Error('Academic period not found')
  await deleteAcademicPeriodRepository(schoolId, academicYearId, id)
}

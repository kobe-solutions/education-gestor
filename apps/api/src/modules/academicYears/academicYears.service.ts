import {
  findAllAcademicYearsRepository,
  findAcademicYearByIdRepository,
  findActiveAcademicYearRepository,
  createAcademicYearRepository,
  updateAcademicYearRepository,
  updateAcademicYearStatusRepository,
  deleteAcademicYearRepository,
} from './academicYears.repository'
import type { CreateAcademicYearBody, UpdateAcademicYearBody } from './academicYears.schema'

export async function listAcademicYearsService(schoolId: string) {
  return findAllAcademicYearsRepository(schoolId)
}

export async function getAcademicYearService(schoolId: string, id: string) {
  const year = await findAcademicYearByIdRepository(schoolId, id)
  if (!year) throw new Error('Academic year not found')
  return year
}

export async function getActiveAcademicYearService(schoolId: string) {
  const year = await findActiveAcademicYearRepository(schoolId)
  if (!year) throw new Error('No active academic year')
  return year
}

export async function createAcademicYearService(schoolId: string, body: CreateAcademicYearBody) {
  return createAcademicYearRepository({
    schoolId,
    year: body.year,
    name: body.name.trim(),
    startDate: body.startDate,
    endDate: body.endDate,
    registrationStart: body.registrationStart,
    registrationEnd: body.registrationEnd,
  })
}

export async function updateAcademicYearService(
  schoolId: string,
  id: string,
  body: UpdateAcademicYearBody,
) {
  const existing = await findAcademicYearByIdRepository(schoolId, id)
  if (!existing) throw new Error('Academic year not found')

  const updated = await updateAcademicYearRepository(schoolId, id, {
    ...body,
    name: body.name?.trim(),
  })
  if (!updated) throw new Error('Academic year not found')
  return updated
}

export async function updateAcademicYearStatusService(
  schoolId: string,
  id: string,
  status: 'planning' | 'active' | 'closed',
) {
  const existing = await findAcademicYearByIdRepository(schoolId, id)
  if (!existing) throw new Error('Academic year not found')

  // Só um ano pode estar ativo por escola
  if (status === 'active') {
    const currentActive = await findActiveAcademicYearRepository(schoolId)
    if (currentActive && currentActive.id !== id) {
      throw new Error('Another academic year is already active')
    }
  }

  const updated = await updateAcademicYearStatusRepository(schoolId, id, status)
  if (!updated) throw new Error('Academic year not found')
  return updated
}

export async function deleteAcademicYearService(schoolId: string, id: string) {
  const existing = await findAcademicYearByIdRepository(schoolId, id)
  if (!existing) throw new Error('Academic year not found')
  if (existing.status === 'active') throw new Error('Cannot delete an active academic year')
  await deleteAcademicYearRepository(schoolId, id)
}

import {
  findAllAcademicPeriodsRepository,
  findAcademicPeriodByIdRepository,
  createAcademicPeriodRepository,
  updateAcademicPeriodRepository,
  deleteAcademicPeriodRepository,
} from './academicPeriods.repository'

type CreateAcademicPeriodServiceInput = {
  schoolId: string
  name: string
  startDate: string
  endDate: string
}

type UpdateAcademicPeriodServiceInput = {
  name?: string
  startDate?: string
  endDate?: string
  active?: boolean
}

export async function listAcademicPeriodsService(schoolId: string) {
  return findAllAcademicPeriodsRepository(schoolId)
}

export async function getAcademicPeriodService(schoolId: string, id: string) {
  const period = await findAcademicPeriodByIdRepository(schoolId, id)
  if (!period) throw new Error('Academic period not found')
  return period
}

export async function createAcademicPeriodService(input: CreateAcademicPeriodServiceInput) {
  return createAcademicPeriodRepository({
    schoolId: input.schoolId,
    name: input.name.trim(),
    startDate: input.startDate,
    endDate: input.endDate,
  })
}

export async function updateAcademicPeriodService(
  schoolId: string,
  id: string,
  input: UpdateAcademicPeriodServiceInput,
) {
  const period = await findAcademicPeriodByIdRepository(schoolId, id)
  if (!period) throw new Error('Academic period not found')
  const updated = await updateAcademicPeriodRepository(schoolId, id, input)
  if (!updated) throw new Error('Academic period not found')
  return updated
}

export async function deleteAcademicPeriodService(schoolId: string, id: string) {
  const period = await findAcademicPeriodByIdRepository(schoolId, id)
  if (!period) throw new Error('Academic period not found')
  await deleteAcademicPeriodRepository(schoolId, id)
}

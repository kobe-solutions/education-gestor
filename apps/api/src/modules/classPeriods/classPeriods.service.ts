import {
  findAllClassPeriodsRepository,
  findClassPeriodByIdRepository,
  createClassPeriodRepository,
  updateClassPeriodRepository,
  deleteClassPeriodRepository,
} from './classPeriods.repository'
import type { CreateClassPeriodBody, UpdateClassPeriodBody } from './classPeriods.schema'

export async function listClassPeriodsService(schoolId: string) {
  return findAllClassPeriodsRepository(schoolId)
}

export async function getClassPeriodService(schoolId: string, id: string) {
  const period = await findClassPeriodByIdRepository(schoolId, id)
  if (!period) throw new Error('Class period not found')
  return period
}

export async function createClassPeriodService(schoolId: string, body: CreateClassPeriodBody) {
  return createClassPeriodRepository({
    schoolId,
    name: body.name.trim(),
    startTime: body.startTime,
    endTime: body.endTime,
    order: body.order,
  })
}

export async function updateClassPeriodService(
  schoolId: string,
  id: string,
  body: UpdateClassPeriodBody,
) {
  const existing = await findClassPeriodByIdRepository(schoolId, id)
  if (!existing) throw new Error('Class period not found')

  const updated = await updateClassPeriodRepository(schoolId, id, {
    ...body,
    name: body.name?.trim(),
  })
  if (!updated) throw new Error('Class period not found')
  return updated
}

export async function deleteClassPeriodService(schoolId: string, id: string) {
  const existing = await findClassPeriodByIdRepository(schoolId, id)
  if (!existing) throw new Error('Class period not found')
  await deleteClassPeriodRepository(schoolId, id)
}

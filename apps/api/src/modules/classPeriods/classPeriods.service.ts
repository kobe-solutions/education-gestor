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
  try {
    await deleteClassPeriodRepository(schoolId, id)
  } catch (error: unknown) {
    const pgError = error as { code?: string; constraint?: string }
    if (pgError.code === '23503' || (pgError.constraint && pgError.constraint.includes('timetable_slots'))) {
      throw new Error(
        'Não é possível excluir este período pois existem horários na grade vinculados a ele. Remova os horários primeiro ou edite o período em vez de excluí-lo.',
      )
    }
    throw error
  }
}

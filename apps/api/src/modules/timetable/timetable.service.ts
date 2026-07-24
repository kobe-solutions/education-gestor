import {
  createTimetableSlotRepository,
  listTimetableSlotsRepository,
  listAllTimetableSlotsRepository,
  findTimetableSlotByIdRepository,
  findConflictingSlotRepository,
  updateTimetableSlotRepository,
  deleteTimetableSlotRepository,
} from './timetable.repository'
import type { CreateTimetableSlotBody, UpdateTimetableSlotBody } from './timetable.schema'

async function assertNoTeacherConflict(
  teacherId: string,
  weekDay: string,
  classPeriodId: string,
  academicYearId: string,
  excludeSlotId?: string,
) {
  const conflict = await findConflictingSlotRepository(
    teacherId,
    weekDay,
    classPeriodId,
    academicYearId,
    excludeSlotId,
  )
  if (conflict) throw new Error('Teacher already has a slot at this time')
}

export async function createTimetableSlotService(schoolId: string, body: CreateTimetableSlotBody) {
  await assertNoTeacherConflict(
    body.teacherId,
    body.weekDay,
    body.classPeriodId,
    body.academicYearId,
  )

  return createTimetableSlotRepository({ schoolId, ...body })
}

export async function listTimetableSlotsService(schoolId: string, classId: string) {
  return listTimetableSlotsRepository(schoolId, classId)
}

export async function listAllTimetableSlotsService(schoolId: string) {
  return listAllTimetableSlotsRepository(schoolId)
}

export async function getTimetableSlotService(schoolId: string, id: string) {
  const slot = await findTimetableSlotByIdRepository(schoolId, id)
  if (!slot) throw new Error('Timetable slot not found')
  return slot
}

export async function updateTimetableSlotService(
  schoolId: string,
  id: string,
  data: UpdateTimetableSlotBody,
) {
  const slot = await findTimetableSlotByIdRepository(schoolId, id)
  if (!slot) throw new Error('Timetable slot not found')

  const isChangingConflictKey =
    data.teacherId !== undefined ||
    data.weekDay !== undefined ||
    data.classPeriodId !== undefined

  if (isChangingConflictKey) {
    await assertNoTeacherConflict(
      data.teacherId ?? slot.teacherId,
      data.weekDay ?? slot.weekDay,
      data.classPeriodId ?? slot.classPeriodId,
      slot.academicYearId,
      id,
    )
  }

  return updateTimetableSlotRepository(schoolId, id, data)
}

export async function deleteTimetableSlotService(schoolId: string, id: string) {
  const slot = await findTimetableSlotByIdRepository(schoolId, id)
  if (!slot) throw new Error('Timetable slot not found')
  await deleteTimetableSlotRepository(schoolId, id)
}

import {
  createTimetableSlotRepository,
  listTimetableSlotsRepository,
  listAllTimetableSlotsRepository,
  findTimetableSlotByIdRepository,
  findConflictingSlotRepository,
  updateTimetableSlotRepository,
  deleteTimetableSlotRepository,
} from './timetable.repository'

type CreateInput = {
  schoolId: string
  classId: string
  academicPeriodId: string
  subjectId: string
  teacherId: string
  weekDay: string
  startTime: string
  endTime: string
}

async function assertNoTeacherConflict(
  teacherId: string,
  weekDay: string,
  startTime: string,
  academicPeriodId: string,
  excludeSlotId?: string,
) {
  const conflict = await findConflictingSlotRepository(
    teacherId,
    weekDay,
    startTime,
    academicPeriodId,
    excludeSlotId,
  )
  if (conflict) throw new Error('Teacher already has a slot at this time')
}

export async function createTimetableSlotService(input: CreateInput) {
  await assertNoTeacherConflict(
    input.teacherId,
    input.weekDay,
    input.startTime,
    input.academicPeriodId,
  )

  return createTimetableSlotRepository(input)
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

type UpdateInput = {
  subjectId?: string
  teacherId?: string
  weekDay?: string
  startTime?: string
  endTime?: string
}

export async function updateTimetableSlotService(schoolId: string, id: string, data: UpdateInput) {
  const slot = await findTimetableSlotByIdRepository(schoolId, id)
  if (!slot) throw new Error('Timetable slot not found')

  const teacherId = data.teacherId ?? slot.teacherId
  const weekDay = data.weekDay ?? slot.weekDay
  const startTime = data.startTime ?? slot.startTime
  const academicPeriodId = slot.academicPeriodId

  const isChangingConflictKey =
    data.teacherId !== undefined ||
    data.weekDay !== undefined ||
    data.startTime !== undefined

  if (isChangingConflictKey) {
    await assertNoTeacherConflict(teacherId, weekDay, startTime, academicPeriodId, id)
  }

  return updateTimetableSlotRepository(schoolId, id, data)
}

export async function deleteTimetableSlotService(schoolId: string, id: string) {
  const slot = await findTimetableSlotByIdRepository(schoolId, id)
  if (!slot) throw new Error('Timetable slot not found')
  await deleteTimetableSlotRepository(schoolId, id)
}

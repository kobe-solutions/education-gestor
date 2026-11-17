import {
  createTimetableSlotRepository,
  createTimetableSlotsBatchRepository,
  listTimetableSlotsRepository,
  listAllTimetableSlotsRepository,
  findTimetableSlotByIdRepository,
  findConflictingSlotRepository,
  listClassPeriodTimesRepository,
  listTeacherSlotTimesByDaysRepository,
  updateTimetableSlotRepository,
  deleteTimetableSlotRepository,
} from './timetable.repository'
import type { CreateTimetableSlotBody, CreateTimetableSlotsBatchBody, UpdateTimetableSlotBody } from './timetable.schema'

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

export async function createTimetableSlotsBatchService(schoolId: string, body: CreateTimetableSlotsBatchBody) {
  const periods = await listClassPeriodTimesRepository(schoolId, body.classPeriodIds)
  if (periods.length !== body.classPeriodIds.length) throw new Error('Class period not found')
  const periodById = new Map(periods.map((period) => [period.id, period]))
  const slots = body.weekDays.flatMap((weekDay) => body.classPeriodIds.map((classPeriodId) => ({
    schoolId,
    classId: body.classId,
    academicYearId: body.academicYearId,
    subjectId: body.subjectId,
    teacherId: body.teacherId,
    weekDay,
    classPeriodId,
  })))

  const existingSlots = await listTeacherSlotTimesByDaysRepository(
    schoolId,
    body.teacherId,
    body.academicYearId,
    body.weekDays,
  )
  const overlaps = (aStart: string, aEnd: string, bStart: string, bEnd: string) => aStart < bEnd && bStart < aEnd

  for (const slot of slots) {
    const period = periodById.get(slot.classPeriodId)
    if (!period) throw new Error('Class period not found')
    const conflictsWithExisting = existingSlots.some((existing) =>
      existing.weekDay === slot.weekDay && overlaps(period.startTime, period.endTime, existing.startTime, existing.endTime),
    )
    const conflictsWithinBatch = slots.some((other) => {
      if (other === slot || other.weekDay !== slot.weekDay) return false
      const otherPeriod = periodById.get(other.classPeriodId)
      return !!otherPeriod && overlaps(period.startTime, period.endTime, otherPeriod.startTime, otherPeriod.endTime)
    })
    if (conflictsWithExisting || conflictsWithinBatch) throw new Error('Teacher already has a slot at this time')
  }

  return createTimetableSlotsBatchRepository(slots)
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

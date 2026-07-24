import {
  findAllCalendarEventsRepository,
  findCalendarEventByIdRepository,
  createCalendarEventRepository,
  updateCalendarEventRepository,
  deleteCalendarEventRepository,
} from './calendarEvents.repository'
import type { CreateCalendarEventBody, UpdateCalendarEventBody } from './calendarEvents.schema'

export async function listCalendarEventsService(schoolId: string, academicYearId: string) {
  return findAllCalendarEventsRepository(schoolId, academicYearId)
}

export async function getCalendarEventService(
  schoolId: string,
  academicYearId: string,
  id: string,
) {
  const event = await findCalendarEventByIdRepository(schoolId, academicYearId, id)
  if (!event) throw new Error('Calendar event not found')
  return event
}

export async function createCalendarEventService(
  schoolId: string,
  academicYearId: string,
  body: CreateCalendarEventBody,
) {
  return createCalendarEventRepository({
    schoolId,
    academicYearId,
    name: body.name.trim(),
    type: body.type,
    startDate: body.startDate,
    endDate: body.endDate,
    affectsAttendance: body.affectsAttendance,
  })
}

export async function updateCalendarEventService(
  schoolId: string,
  academicYearId: string,
  id: string,
  body: UpdateCalendarEventBody,
) {
  const existing = await findCalendarEventByIdRepository(schoolId, academicYearId, id)
  if (!existing) throw new Error('Calendar event not found')

  const updated = await updateCalendarEventRepository(schoolId, academicYearId, id, {
    ...body,
    name: body.name?.trim(),
  })
  if (!updated) throw new Error('Calendar event not found')
  return updated
}

export async function deleteCalendarEventService(
  schoolId: string,
  academicYearId: string,
  id: string,
) {
  const existing = await findCalendarEventByIdRepository(schoolId, academicYearId, id)
  if (!existing) throw new Error('Calendar event not found')
  await deleteCalendarEventRepository(schoolId, academicYearId, id)
}

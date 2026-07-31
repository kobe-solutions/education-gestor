import {
  findAllEventsRepository,
  findEventByIdRepository,
  createEventRepository,
  updateEventRepository,
  deleteEventRepository,
} from './events.repository'
import type { CreateEventBody, UpdateEventBody, ListEventsQuery } from './events.schema'

type EventSchedule = {
  id?: string
  date: string
  startTime: string | null
  endTime: string | null
  allDay: boolean
}

function schedulesOverlap(left: EventSchedule, right: EventSchedule) {
  if (left.date !== right.date) return false

  if (
    left.allDay ||
    right.allDay ||
    left.startTime === null ||
    left.endTime === null ||
    right.startTime === null ||
    right.endTime === null
  ) {
    return true
  }

  return left.startTime < right.endTime && right.startTime < left.endTime
}

async function assertNoEventConflict(
  schoolId: string,
  schedule: EventSchedule,
  excludeEventId?: string,
) {
  const eventsOnDate = await findAllEventsRepository(schoolId, {
    from: schedule.date,
    to: schedule.date,
  })
  const conflict = eventsOnDate.find(
    (event) => event.id !== excludeEventId && schedulesOverlap(schedule, event),
  )

  if (conflict) throw new Error('Event already exists at this time')
}

export async function listEventsService(schoolId: string, filters: ListEventsQuery = {}) {
  return findAllEventsRepository(schoolId, filters)
}

export async function getEventService(schoolId: string, id: string) {
  const event = await findEventByIdRepository(schoolId, id)
  if (!event) throw new Error('Event not found')
  return event
}

export async function createEventService(schoolId: string, body: CreateEventBody) {
  const event = {
    schoolId,
    title: body.title.trim(),
    category: body.category.trim(),
    date: body.date,
    startTime: body.startTime ?? null,
    endTime: body.endTime ?? null,
    allDay: body.allDay,
    location: body.location?.trim() || null,
    description: body.description?.trim() || null,
  }
  await assertNoEventConflict(schoolId, event)
  return createEventRepository(event)
}

export async function updateEventService(
  schoolId: string,
  id: string,
  body: UpdateEventBody,
) {
  const existing = await findEventByIdRepository(schoolId, id)
  if (!existing) throw new Error('Event not found')

  const schedule = {
    id,
    date: body.date ?? existing.date,
    startTime: body.startTime !== undefined ? body.startTime : existing.startTime,
    endTime: body.endTime !== undefined ? body.endTime : existing.endTime,
    allDay: body.allDay ?? existing.allDay,
  }
  await assertNoEventConflict(schoolId, schedule, id)

  const updated = await updateEventRepository(schoolId, id, {
    ...(body.title !== undefined && { title: body.title.trim() }),
    ...(body.category !== undefined && { category: body.category.trim() }),
    ...(body.date !== undefined && { date: body.date }),
    ...(body.startTime !== undefined && { startTime: body.startTime }),
    ...(body.endTime !== undefined && { endTime: body.endTime }),
    ...(body.allDay !== undefined && { allDay: body.allDay }),
    ...(body.location !== undefined && { location: body.location?.trim() || null }),
    ...(body.description !== undefined && { description: body.description?.trim() || null }),
  })
  if (!updated) throw new Error('Event not found')
  return updated
}

export async function deleteEventService(schoolId: string, id: string) {
  const existing = await findEventByIdRepository(schoolId, id)
  if (!existing) throw new Error('Event not found')
  await deleteEventRepository(schoolId, id)
}

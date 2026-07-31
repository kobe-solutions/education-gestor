import {
  findAllEventsRepository,
  findEventByIdRepository,
  createEventRepository,
  updateEventRepository,
  deleteEventRepository,
} from './events.repository'
import type { CreateEventBody, UpdateEventBody, ListEventsQuery } from './events.schema'

export async function listEventsService(schoolId: string, filters: ListEventsQuery = {}) {
  return findAllEventsRepository(schoolId, filters)
}

export async function getEventService(schoolId: string, id: string) {
  const event = await findEventByIdRepository(schoolId, id)
  if (!event) throw new Error('Event not found')
  return event
}

export async function createEventService(schoolId: string, body: CreateEventBody) {
  return createEventRepository({
    schoolId,
    title: body.title.trim(),
    category: body.category.trim(),
    date: body.date,
    startTime: body.startTime ?? null,
    endTime: body.endTime ?? null,
    allDay: body.allDay,
    location: body.location?.trim() || null,
    description: body.description?.trim() || null,
  })
}

export async function updateEventService(
  schoolId: string,
  id: string,
  body: UpdateEventBody,
) {
  const existing = await findEventByIdRepository(schoolId, id)
  if (!existing) throw new Error('Event not found')

  const updated = await updateEventRepository(schoolId, id, {
    title: body.title?.trim(),
    category: body.category?.trim(),
    date: body.date,
    startTime: body.startTime ?? null,
    endTime: body.endTime ?? null,
    allDay: body.allDay,
    location: body.location?.trim() || null,
    description: body.description?.trim() || null,
  })
  if (!updated) throw new Error('Event not found')
  return updated
}

export async function deleteEventService(schoolId: string, id: string) {
  const existing = await findEventByIdRepository(schoolId, id)
  if (!existing) throw new Error('Event not found')
  await deleteEventRepository(schoolId, id)
}

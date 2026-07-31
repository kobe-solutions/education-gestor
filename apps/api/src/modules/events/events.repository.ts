import { and, eq, gte, lte } from 'drizzle-orm'
import { db } from '../../db'
import { events } from '../../db/schema'

type CreateEventInput = {
  schoolId: string
  title: string
  category: string
  date: string
  startTime: string | null
  endTime: string | null
  allDay: boolean
  location: string | null
  description: string | null
}

type UpdateEventInput = Partial<Omit<CreateEventInput, 'schoolId'>>

type ListEventsFilters = {
  from?: string
  to?: string
  category?: string
}

const baseSelect = {
  id: events.id,
  schoolId: events.schoolId,
  title: events.title,
  category: events.category,
  date: events.date,
  startTime: events.startTime,
  endTime: events.endTime,
  allDay: events.allDay,
  location: events.location,
  description: events.description,
  createdAt: events.createdAt,
  updatedAt: events.updatedAt,
}

export async function findAllEventsRepository(
  schoolId: string,
  filters: ListEventsFilters = {},
) {
  const conditions = [eq(events.schoolId, schoolId)]

  if (filters.from) conditions.push(gte(events.date, filters.from))
  if (filters.to) conditions.push(lte(events.date, filters.to))
  if (filters.category) conditions.push(eq(events.category, filters.category))

  return db
    .select(baseSelect)
    .from(events)
    .where(and(...conditions))
    .orderBy(events.date)
}

export async function findEventByIdRepository(schoolId: string, id: string) {
  const [event] = await db
    .select(baseSelect)
    .from(events)
    .where(and(eq(events.schoolId, schoolId), eq(events.id, id)))
    .limit(1)

  return event
}

export async function createEventRepository(input: CreateEventInput) {
  const [event] = await db.insert(events).values(input).returning(baseSelect)
  return event
}

export async function updateEventRepository(
  schoolId: string,
  id: string,
  input: UpdateEventInput,
) {
  const [event] = await db
    .update(events)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(events.schoolId, schoolId), eq(events.id, id)))
    .returning(baseSelect)

  return event
}

export async function deleteEventRepository(schoolId: string, id: string) {
  await db.delete(events).where(and(eq(events.schoolId, schoolId), eq(events.id, id)))
}

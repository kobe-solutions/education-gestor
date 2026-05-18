import { eq, and } from 'drizzle-orm'
import { db } from '../../db'
import { calendarEvents } from '../../db/schema'

type CreateCalendarEventInput = {
  schoolId: string
  academicYearId: string
  name: string
  type: string
  startDate: string
  endDate: string
  affectsAttendance: boolean
}

type UpdateCalendarEventInput = {
  name?: string
  type?: string
  startDate?: string
  endDate?: string
  affectsAttendance?: boolean
}

const baseSelect = {
  id: calendarEvents.id,
  schoolId: calendarEvents.schoolId,
  academicYearId: calendarEvents.academicYearId,
  name: calendarEvents.name,
  type: calendarEvents.type,
  startDate: calendarEvents.startDate,
  endDate: calendarEvents.endDate,
  affectsAttendance: calendarEvents.affectsAttendance,
  createdAt: calendarEvents.createdAt,
  updatedAt: calendarEvents.updatedAt,
}

export async function findAllCalendarEventsRepository(schoolId: string, academicYearId: string) {
  return db
    .select(baseSelect)
    .from(calendarEvents)
    .where(
      and(
        eq(calendarEvents.schoolId, schoolId),
        eq(calendarEvents.academicYearId, academicYearId),
      ),
    )
}

export async function findCalendarEventByIdRepository(
  schoolId: string,
  academicYearId: string,
  id: string,
) {
  const [event] = await db
    .select(baseSelect)
    .from(calendarEvents)
    .where(
      and(
        eq(calendarEvents.schoolId, schoolId),
        eq(calendarEvents.academicYearId, academicYearId),
        eq(calendarEvents.id, id),
      ),
    )
    .limit(1)

  return event
}

export async function createCalendarEventRepository(input: CreateCalendarEventInput) {
  const [event] = await db.insert(calendarEvents).values(input).returning(baseSelect)
  return event
}

export async function updateCalendarEventRepository(
  schoolId: string,
  academicYearId: string,
  id: string,
  input: UpdateCalendarEventInput,
) {
  const [event] = await db
    .update(calendarEvents)
    .set({ ...input, updatedAt: new Date() })
    .where(
      and(
        eq(calendarEvents.schoolId, schoolId),
        eq(calendarEvents.academicYearId, academicYearId),
        eq(calendarEvents.id, id),
      ),
    )
    .returning(baseSelect)

  return event
}

export async function deleteCalendarEventRepository(
  schoolId: string,
  academicYearId: string,
  id: string,
) {
  await db
    .delete(calendarEvents)
    .where(
      and(
        eq(calendarEvents.schoolId, schoolId),
        eq(calendarEvents.academicYearId, academicYearId),
        eq(calendarEvents.id, id),
      ),
    )
}

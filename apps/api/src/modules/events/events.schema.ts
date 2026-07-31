import { z } from 'zod'

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/

export const createEventBodySchema = z.object({
  title: z.string().min(2),
  category: z.string().min(1),
  date: z.string().date(),
  startTime: z.string().regex(timeRegex, 'Use o formato HH:MM').nullable().optional(),
  endTime: z.string().regex(timeRegex, 'Use o formato HH:MM').nullable().optional(),
  allDay: z.boolean().default(false),
  location: z.string().min(1).nullable().optional(),
  description: z.string().nullable().optional(),
})

export const updateEventBodySchema = z.object({
  title: z.string().min(2).optional(),
  category: z.string().min(1).optional(),
  date: z.string().date().optional(),
  startTime: z.string().regex(timeRegex, 'Use o formato HH:MM').nullable().optional(),
  endTime: z.string().regex(timeRegex, 'Use o formato HH:MM').nullable().optional(),
  allDay: z.boolean().optional(),
  location: z.string().min(1).nullable().optional(),
  description: z.string().nullable().optional(),
})

export const listEventsQuerySchema = z.object({
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  category: z.string().min(1).optional(),
})

export type CreateEventBody = z.infer<typeof createEventBodySchema>
export type UpdateEventBody = z.infer<typeof updateEventBodySchema>
export type ListEventsQuery = z.infer<typeof listEventsQuerySchema>

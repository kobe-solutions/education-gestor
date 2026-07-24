import { z } from 'zod'

const eventType = z.enum([
  'ferias',
  'recesso',
  'feriado',
  'prova',
  'reuniao_pais',
  'conselho_classe',
  'formacao',
  'semana_pedagogica',
  'outro',
])

export const createCalendarEventBodySchema = z.object({
  name: z.string().min(2),
  type: eventType,
  startDate: z.string().date(),
  endDate: z.string().date(),
  affectsAttendance: z.boolean().default(false),
})

export const updateCalendarEventBodySchema = z.object({
  name: z.string().min(2).optional(),
  type: eventType.optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  affectsAttendance: z.boolean().optional(),
})

export type CreateCalendarEventBody = z.infer<typeof createCalendarEventBodySchema>
export type UpdateCalendarEventBody = z.infer<typeof updateCalendarEventBodySchema>

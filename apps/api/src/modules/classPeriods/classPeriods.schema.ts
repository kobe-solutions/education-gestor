import { z } from 'zod'

const timeRegex = /^\d{2}:\d{2}$/

export const createClassPeriodBodySchema = z.object({
  name: z.string().min(1),
  startTime: z.string().regex(timeRegex, 'Formato HH:MM'),
  endTime: z.string().regex(timeRegex, 'Formato HH:MM'),
  order: z.number().int().min(1),
})

export const updateClassPeriodBodySchema = z.object({
  name: z.string().min(1).optional(),
  startTime: z.string().regex(timeRegex, 'Formato HH:MM').optional(),
  endTime: z.string().regex(timeRegex, 'Formato HH:MM').optional(),
  order: z.number().int().min(1).optional(),
})

export type CreateClassPeriodBody = z.infer<typeof createClassPeriodBodySchema>
export type UpdateClassPeriodBody = z.infer<typeof updateClassPeriodBodySchema>

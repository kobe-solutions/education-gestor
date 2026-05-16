import { z } from 'zod'

export const WEEK_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const

export const createTimetableSlotBodySchema = z.object({
  classId: z.string().uuid(),
  academicPeriodId: z.string().uuid(),
  subjectId: z.string().uuid(),
  teacherId: z.string().uuid(),
  weekDay: z.enum(WEEK_DAYS),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
})

export const updateTimetableSlotBodySchema = z.object({
  subjectId: z.string().uuid().optional(),
  teacherId: z.string().uuid().optional(),
  weekDay: z.enum(WEEK_DAYS).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM').optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM').optional(),
})

export type CreateTimetableSlotBody = z.infer<typeof createTimetableSlotBodySchema>
export type UpdateTimetableSlotBody = z.infer<typeof updateTimetableSlotBodySchema>

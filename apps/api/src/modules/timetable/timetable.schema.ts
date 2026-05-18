import { z } from 'zod'

export const WEEK_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const

export const createTimetableSlotBodySchema = z.object({
  classId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  classPeriodId: z.string().uuid(),
  subjectId: z.string().uuid(),
  teacherId: z.string().uuid(),
  weekDay: z.enum(WEEK_DAYS),
})

export const updateTimetableSlotBodySchema = z.object({
  classPeriodId: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
  teacherId: z.string().uuid().optional(),
  weekDay: z.enum(WEEK_DAYS).optional(),
})

export type CreateTimetableSlotBody = z.infer<typeof createTimetableSlotBodySchema>
export type UpdateTimetableSlotBody = z.infer<typeof updateTimetableSlotBodySchema>

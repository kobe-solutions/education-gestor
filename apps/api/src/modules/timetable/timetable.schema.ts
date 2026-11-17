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

export const createTimetableSlotsBatchBodySchema = z.object({
  classId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  subjectId: z.string().uuid(),
  teacherId: z.string().uuid(),
  weekDays: z.array(z.enum(WEEK_DAYS)).min(1).max(WEEK_DAYS.length),
  classPeriodIds: z.array(z.string().uuid()).min(1).max(30),
}).superRefine((value, ctx) => {
  if (new Set(value.weekDays).size !== value.weekDays.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['weekDays'], message: 'Dias repetidos' })
  }
  if (new Set(value.classPeriodIds).size !== value.classPeriodIds.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['classPeriodIds'], message: 'Horários repetidos' })
  }
})

export const updateTimetableSlotBodySchema = z.object({
  classPeriodId: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
  teacherId: z.string().uuid().optional(),
  weekDay: z.enum(WEEK_DAYS).optional(),
})

export type CreateTimetableSlotBody = z.infer<typeof createTimetableSlotBodySchema>
export type CreateTimetableSlotsBatchBody = z.infer<typeof createTimetableSlotsBatchBodySchema>
export type UpdateTimetableSlotBody = z.infer<typeof updateTimetableSlotBodySchema>

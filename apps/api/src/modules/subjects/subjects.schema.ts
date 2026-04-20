import { z } from 'zod'

export const createSubjectBodySchema = z.object({
  name: z.string().min(2),
  code: z.string().min(1).optional(),
  weeklyHours: z.number().int().positive(),
})

export const createSubjectResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  name: z.string(),
  code: z.string().nullable(),
  weeklyHours: z.number().int().positive(),
  createdAt: z.date(),
})

export type CreateSubjectBody = z.infer<typeof createSubjectBodySchema>

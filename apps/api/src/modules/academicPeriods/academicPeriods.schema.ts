import { z } from 'zod'

export const createAcademicPeriodBodySchema = z.object({
  name: z.string().min(2),
  startDate: z.string().date(),
  endDate: z.string().date(),
})

export const updateAcademicPeriodBodySchema = z.object({
  name: z.string().min(2).optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  active: z.boolean().optional(),
})

export type CreateAcademicPeriodBody = z.infer<typeof createAcademicPeriodBodySchema>
export type UpdateAcademicPeriodBody = z.infer<typeof updateAcademicPeriodBodySchema>

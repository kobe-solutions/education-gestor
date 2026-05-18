import { z } from 'zod'

const periodType = z.enum(['bimestre', 'trimestre', 'semestre'])

export const createAcademicPeriodBodySchema = z.object({
  name: z.string().min(2),
  type: periodType,
  order: z.number().int().min(1),
  startDate: z.string().date(),
  endDate: z.string().date(),
  gradeClosingDate: z.string().date().optional(),
})

export const updateAcademicPeriodBodySchema = z.object({
  name: z.string().min(2).optional(),
  type: periodType.optional(),
  order: z.number().int().min(1).optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  gradeClosingDate: z.string().date().nullable().optional(),
})

export type CreateAcademicPeriodBody = z.infer<typeof createAcademicPeriodBodySchema>
export type UpdateAcademicPeriodBody = z.infer<typeof updateAcademicPeriodBodySchema>

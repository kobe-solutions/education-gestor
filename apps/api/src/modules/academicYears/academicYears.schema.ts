import { z } from 'zod'

export const createAcademicYearBodySchema = z.object({
  year: z.number().int().min(2000).max(2100),
  name: z.string().min(2),
  startDate: z.string().date(),
  endDate: z.string().date(),
  registrationStart: z.string().date().optional(),
  registrationEnd: z.string().date().optional(),
})

export const updateAcademicYearBodySchema = z.object({
  name: z.string().min(2).optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  registrationStart: z.string().date().nullable().optional(),
  registrationEnd: z.string().date().nullable().optional(),
})

export const updateAcademicYearStatusBodySchema = z.object({
  status: z.enum(['planning', 'active', 'closed']),
})

export type CreateAcademicYearBody = z.infer<typeof createAcademicYearBodySchema>
export type UpdateAcademicYearBody = z.infer<typeof updateAcademicYearBodySchema>
export type UpdateAcademicYearStatusBody = z.infer<typeof updateAcademicYearStatusBodySchema>

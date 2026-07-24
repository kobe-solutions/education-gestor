import { z } from 'zod'

export const createSchoolClassBodySchema = z.object({
  name: z.string().min(2),
  shift: z.string().min(1),
  serieId: z.string().uuid().optional(),
  academicPeriodId: z.string().uuid().optional(),
  maxStudents: z.number().int().min(1).optional(),
})

export const updateSchoolClassBodySchema = z.object({
  name: z.string().min(2).optional(),
  shift: z.string().optional(),
  serieId: z.string().uuid().nullable().optional(),
  academicPeriodId: z.string().uuid().nullable().optional(),
  maxStudents: z.number().int().min(1).optional(),
})

export const addMemberBodySchema = z.object({
  id: z.string().uuid(),
})

export type CreateSchoolClassBody = z.infer<typeof createSchoolClassBodySchema>
export type UpdateSchoolClassBody = z.infer<typeof updateSchoolClassBodySchema>
export type AddMemberBody = z.infer<typeof addMemberBodySchema>

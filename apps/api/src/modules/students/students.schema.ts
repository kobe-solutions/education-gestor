import { z } from 'zod'

export const createStudentBodySchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional(),
  birthDate: z.string().date().optional(),
  enrollmentCode: z.string().min(1),
})

export const updateStudentBodySchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  birthDate: z.string().date().optional(),
  enrollmentCode: z.string().min(1).optional(),
})

export const createGuardianBodySchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  relationship: z.string().min(2),
})

export const studentResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  name: z.string(),
  email: z.string().email().nullable(),
  birthDate: z.string().nullable(),
  enrollmentCode: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type CreateStudentBody = z.infer<typeof createStudentBodySchema>
export type UpdateStudentBody = z.infer<typeof updateStudentBodySchema>
export type CreateGuardianBody = z.infer<typeof createGuardianBodySchema>

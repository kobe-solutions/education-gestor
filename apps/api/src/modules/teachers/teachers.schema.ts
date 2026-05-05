import { z } from 'zod'

export const userRoleSchema = z.enum(['gestor', 'professor'])

export const createTeacherBodySchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
})

export const loginTeacherBodySchema = z.object({
  schoolId: z.string().uuid(),
  email: z.string().email(),
  password: z.string().min(8),
})

export const createTeacherResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  role: userRoleSchema,
  createdAt: z.date(),
})

export const updateTeacherBodySchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
})

export type CreateTeacherBody = z.infer<typeof createTeacherBodySchema>
export type LoginTeacherBody = z.infer<typeof loginTeacherBodySchema>
export type UpdateTeacherBody = z.infer<typeof updateTeacherBodySchema>

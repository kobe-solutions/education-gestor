import { z } from 'zod'

export const schoolRoleSchema = z.literal('gestor')

export const createSchoolBodySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  director: z.string().optional(),
  coordinator: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
})

export const loginSchoolBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const schoolAuthResponseSchema = z.object({
  accessToken: z.string(),
})

export const createSchoolResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  email: z.string().email(),
  role: schoolRoleSchema,
})

export const updateSchoolBodySchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().min(2).optional(),
  email: z.string().email().optional(),
  director: z.string().optional().nullable(),
  coordinator: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
})

export const changePasswordBodySchema = z.object({
  password: z.string().min(8),
})

export type CreateSchoolBody = z.infer<typeof createSchoolBodySchema>
export type LoginSchoolBody = z.infer<typeof loginSchoolBodySchema>
export type UpdateSchoolBody = z.infer<typeof updateSchoolBodySchema>
export type ChangePasswordBody = z.infer<typeof changePasswordBodySchema>

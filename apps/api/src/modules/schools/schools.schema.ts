import { z } from 'zod'

export const schoolRoleSchema = z.literal('gestor')

export const createSchoolBodySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
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

export type CreateSchoolBody = z.infer<typeof createSchoolBodySchema>
export type LoginSchoolBody = z.infer<typeof loginSchoolBodySchema>

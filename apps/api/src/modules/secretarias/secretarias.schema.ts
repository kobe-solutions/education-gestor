import { z } from 'zod'

export const createSecretariaBodySchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
})

export const addSchoolBodySchema = z.object({
  schoolId: z.string().uuid(),
})

export const createSecretariaResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  role: z.literal('secretaria'),
  createdAt: z.date(),
})

export const schoolLinkResponseSchema = z.object({
  id: z.string().uuid(),
  secretariaId: z.string().uuid(),
  schoolId: z.string().uuid(),
  createdAt: z.date(),
})

export type CreateSecretariaBody = z.infer<typeof createSecretariaBodySchema>
export type AddSchoolBody = z.infer<typeof addSchoolBodySchema>

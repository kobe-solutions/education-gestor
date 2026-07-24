import { z } from 'zod'

export const createSecretariaBodySchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  address: z.string().optional(),
  responsible: z.string().optional(),
})

export const updateSecretariaBodySchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  responsible: z.string().nullable().optional(),
  active: z.boolean().optional(),
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
export type UpdateSecretariaBody = z.infer<typeof updateSecretariaBodySchema>
export type AddSchoolBody = z.infer<typeof addSchoolBodySchema>

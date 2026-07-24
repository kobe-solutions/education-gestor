import { z } from 'zod'

export const EDUCATION_LEVEL_TYPES = [
  'infantil_creche',
  'infantil_pre_escola',
  'fundamental_1',
  'fundamental_2',
  'medio',
  'tecnico',
  'superior',
] as const

export const EDUCATION_MODALITIES = [
  'eja',
  'integral',
  'profissionalizante',
  'especial',
] as const

export const createEducationLevelBodySchema = z.object({
  type: z.enum(EDUCATION_LEVEL_TYPES),
  modality: z.enum(EDUCATION_MODALITIES).optional(),
  name: z.string().min(2),
  active: z.boolean().optional(),
})

export const updateEducationLevelBodySchema = z.object({
  type: z.enum(EDUCATION_LEVEL_TYPES).optional(),
  modality: z.enum(EDUCATION_MODALITIES).nullable().optional(),
  name: z.string().min(2).optional(),
  active: z.boolean().optional(),
})

export type CreateEducationLevelBody = z.infer<typeof createEducationLevelBodySchema>
export type UpdateEducationLevelBody = z.infer<typeof updateEducationLevelBodySchema>

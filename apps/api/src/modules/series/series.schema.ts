import { z } from 'zod'

export const createSerieBodySchema = z.object({
  educationLevelId: z.string().uuid(),
  name: z.string().min(2),
  order: z.number().int().min(0).optional(),
})

export const updateSerieBodySchema = z.object({
  name: z.string().min(2).optional(),
  order: z.number().int().min(0).optional(),
})

export type CreateSerieBody = z.infer<typeof createSerieBodySchema>
export type UpdateSerieBody = z.infer<typeof updateSerieBodySchema>

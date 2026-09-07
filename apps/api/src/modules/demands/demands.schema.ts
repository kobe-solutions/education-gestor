import { z } from 'zod'

export const createDemandBodySchema = z.object({
  type: z.string().min(1, 'Tipo obrigatório'),
  title: z.string().min(1, 'Título obrigatório'),
  description: z.string().optional(),
  responsible: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  dueDate: z.string().optional(),
})

export const updateDemandBodySchema = z.object({
  type: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  responsible: z.string().optional(),
  status: z.enum(['open', 'in_progress', 'resolved', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  dueDate: z.string().optional(),
})

export type CreateDemandBody = z.infer<typeof createDemandBodySchema>
export type UpdateDemandBody = z.infer<typeof updateDemandBodySchema>

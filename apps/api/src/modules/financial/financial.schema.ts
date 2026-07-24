import { z } from 'zod'

export const createTuitionBodySchema = z.object({
  studentId: z.string().uuid(),
  amount: z.number().positive(),
  dueDate: z.string().date(),
})

export const tuitionStatusSchema = z.enum(['pending', 'paid', 'overdue'])

export const updateTuitionBodySchema = z.object({
  amount: z.number().positive().optional(),
  dueDate: z.string().date().optional(),
})

export type CreateTuitionBody = z.infer<typeof createTuitionBodySchema>
export type UpdateTuitionBody = z.infer<typeof updateTuitionBodySchema>
export type TuitionStatus = z.infer<typeof tuitionStatusSchema>

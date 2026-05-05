import { z } from 'zod'

export const createTuitionBodySchema = z.object({
  studentId: z.string().uuid(),
  amount: z.number().positive(),
  dueDate: z.string().date(),
})

export const tuitionStatusSchema = z.enum(['pending', 'paid', 'overdue'])

export type CreateTuitionBody = z.infer<typeof createTuitionBodySchema>
export type TuitionStatus = z.infer<typeof tuitionStatusSchema>

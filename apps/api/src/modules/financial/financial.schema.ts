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

export const createBulkTuitionsBodySchema = z.object({
  scope: z.enum(['school', 'class', 'series']),
  classId: z.string().uuid().optional(),
  seriesId: z.string().uuid().optional(),
  amount: z.number().positive(),
  firstDueDate: z.string().date(),
  installments: z.number().int().min(1).max(12).default(1),
}).refine((data) => data.scope !== 'class' || !!data.classId, {
  message: 'Selecione a turma para geração em lote.',
  path: ['classId'],
}).refine((data) => data.scope !== 'series' || !!data.seriesId, {
  message: 'Selecione a série para geração em lote.',
  path: ['seriesId'],
})

export const reversePaymentBodySchema = z.object({
  reason: z.string().trim().max(300).optional(),
})

export type CreateTuitionBody = z.infer<typeof createTuitionBodySchema>
export type UpdateTuitionBody = z.infer<typeof updateTuitionBodySchema>
export type CreateBulkTuitionsBody = z.infer<typeof createBulkTuitionsBodySchema>
export type ReversePaymentBody = z.infer<typeof reversePaymentBodySchema>
export type TuitionStatus = z.infer<typeof tuitionStatusSchema>

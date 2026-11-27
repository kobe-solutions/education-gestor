import { z } from 'zod'

export const registerGradeBodySchema = z.object({
  classId: z.string().uuid(),
  studentId: z.string().uuid(),
  teacherId: z.string().uuid(),
  subjectId: z.string().uuid(),
  academicPeriodId: z.string().uuid(),
  assessmentId: z.string().uuid().nullable().optional(),
  value: z.number().min(0).max(10),
})

export const registerAttendanceBodySchema = z.object({
  classId: z.string().uuid(),
  studentId: z.string().uuid(),
  date: z.string().date(),
  present: z.boolean(),
})

export const bulkAttendanceBodySchema = z.object({
  classId: z.string().uuid(),
  date: z.string().date(),
  attendances: z.array(
    z.object({
      studentId: z.string().uuid(),
      present: z.boolean(),
    }),
  ),
})

export const bulkGradeBodySchema = z.object({
  classId: z.string().uuid(),
  subjectId: z.string().uuid(),
  teacherId: z.string().uuid(),
  grades: z.array(
    z.object({
      studentId: z.string().uuid(),
      academicPeriodId: z.string().uuid(),
      assessmentId: z.string().uuid().nullable().optional(),
      value: z.number().min(0).max(10),
    }),
  ).max(500),
  deleteGradeIds: z.array(z.string().uuid()).max(500).optional(),
})

export const createAssessmentBodySchema = z.object({
  classId: z.string().uuid(),
  subjectId: z.string().uuid(),
  academicPeriodId: z.string().uuid(),
  teacherId: z.string().uuid(),
  name: z.string().trim().min(1, 'Nome da avaliação é obrigatório').max(80),
  weight: z.number().positive('Peso deve ser maior que zero').max(100).optional().default(1),
})

export const updateAssessmentBodySchema = z.object({
  name: z.string().trim().min(1, 'Nome da avaliação é obrigatório').max(80).optional(),
  weight: z.number().positive('Peso deve ser maior que zero').max(100).optional(),
  order: z.number().int().min(0).optional(),
})

export const upsertPeriodGradeConfigBodySchema = z.object({
  classId: z.string().uuid(),
  subjectId: z.string().uuid(),
  academicPeriodId: z.string().uuid(),
  calculationMethod: z.enum(['simple', 'weighted']),
})

export type RegisterGradeBody = z.infer<typeof registerGradeBodySchema>

export type RegisterAttendanceBody = z.infer<typeof registerAttendanceBodySchema>
export type BulkAttendanceBody = z.infer<typeof bulkAttendanceBodySchema>
export type BulkGradeBody = z.infer<typeof bulkGradeBodySchema>
export type CreateAssessmentBody = z.infer<typeof createAssessmentBodySchema>
export type UpdateAssessmentBody = z.infer<typeof updateAssessmentBodySchema>
export type UpsertPeriodGradeConfigBody = z.infer<typeof upsertPeriodGradeConfigBodySchema>

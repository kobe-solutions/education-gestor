import { z } from 'zod'

export const registerGradeBodySchema = z.object({
  classId: z.string().uuid(),
  studentId: z.string().uuid(),
  teacherId: z.string().uuid(),
  subjectId: z.string().uuid(),
  academicPeriodId: z.string().uuid(),
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
      value: z.number().min(0).max(10),
    }),
  ).max(500),
})

export type RegisterGradeBody = z.infer<typeof registerGradeBodySchema>

export type RegisterAttendanceBody = z.infer<typeof registerAttendanceBodySchema>
export type BulkAttendanceBody = z.infer<typeof bulkAttendanceBodySchema>
export type BulkGradeBody = z.infer<typeof bulkGradeBodySchema>

import { z } from 'zod'

export const createLessonRecordSchema = z.object({
  classId: z.string().uuid('Turma inválida'),
  subjectId: z.string().uuid('Disciplina inválida'),
  timetableSlotId: z.string().uuid('Aula da grade inválida'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  title: z.string().trim().min(3, 'Informe um título').max(120),
  topic: z.string().trim().min(2, 'Informe o conteúdo trabalhado').max(160),
  description: z.string().trim().max(4000).optional().default(''),
})

export const updateLessonRecordSchema = createLessonRecordSchema
  .omit({ timetableSlotId: true })
  .extend({ timetableSlotId: z.string().uuid().nullable().optional() })

export const listLessonRecordsQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  teacherId: z.string().uuid().optional(),
  classId: z.string().uuid().optional(),
})

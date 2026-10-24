import { randomUUID } from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middlewares/auth'
import { injectTenant } from '../../middlewares/tenant'
import { authorizeRoles, type TenantPayload } from '../../middlewares/authorize'
import { getSchoolId } from '../../lib/routeHelpers'
import { deleteFile, uploadFile } from '../../lib/storage'
import { logAudit } from '../../lib/audit'
import { createLessonRecordSchema, listLessonRecordsQuerySchema, updateLessonRecordSchema } from './lessonRecords.schema'
import {
  createLessonRecordService,
  deleteLessonRecordService,
  getLessonRecordService,
  getLessonRecordSummaryService,
  listLessonRecordsService,
  updateLessonRecordService,
  validateLessonAssignmentService,
} from './lessonRecords.service'

const readAccess = [authenticate, injectTenant, authorizeRoles(['gestor', 'professor'])]
const managerAccess = [authenticate, injectTenant, authorizeRoles(['gestor'])]
const teacherAccess = [authenticate, injectTenant, authorizeRoles(['professor'])]
const allowedContentTypes = new Set([
  'application/pdf',
  'image/jpeg', 'image/png', 'image/webp',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

export async function lessonRecordsRoutes(app: FastifyInstance) {
  app.get('/lesson-records/summary', { preHandler: managerAccess }, async (request, reply) => {
    const { month } = request.query as { month?: string }
    return reply.send(await getLessonRecordSummaryService(getSchoolId(request), month))
  })

  app.get('/lesson-records', { preHandler: readAccess }, async (request, reply) => {
    const query = listLessonRecordsQuerySchema.parse(request.query)
    const user = request.user as TenantPayload
    return reply.send(await listLessonRecordsService(getSchoolId(request), {
      ...query,
      ...(user.role === 'professor' ? { ownTeacherId: user.userId } : {}),
    }))
  })

  app.get('/lesson-records/:id', { preHandler: readAccess }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const user = request.user as TenantPayload
    try {
      return reply.send(await getLessonRecordService(getSchoolId(request), id, user.role === 'professor' ? user.userId : undefined))
    } catch (error) {
      if (error instanceof Error && error.message === 'Lesson record not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })

  app.post('/lesson-records', { preHandler: teacherAccess }, async (request, reply) => {
    const fields: Record<string, string> = {}
    const files: Array<{ filename: string; contentType: string; buffer: Buffer }> = []
    for await (const part of request.parts({ limits: { files: 5, fileSize: 10 * 1024 * 1024, fields: 8 } })) {
      if (part.type === 'file') {
        if (!allowedContentTypes.has(part.mimetype)) {
          await part.toBuffer()
          return reply.status(400).send({ message: `Formato não permitido: ${part.filename}` })
        }
        files.push({ filename: part.filename, contentType: part.mimetype, buffer: await part.toBuffer() })
      } else if (typeof part.value === 'string') {
        fields[part.fieldname] = part.value
      }
    }

    const parsed = createLessonRecordSchema.safeParse(fields)
    if (!parsed.success) return reply.status(400).send({ message: 'Dados do registro inválidos', issues: parsed.error.flatten() })
    const user = request.user as TenantPayload
    const schoolId = getSchoolId(request)
    try {
      await validateLessonAssignmentService(schoolId, user.userId, parsed.data.classId, parsed.data.subjectId, parsed.data.timetableSlotId, parsed.data.date)
    } catch {
      return reply.status(403).send({ message: 'A turma ou disciplina não está vinculada a este professor.' })
    }

    const attachments = await Promise.all(files.map(async (file) => {
      const id = randomUUID()
      const safeName = file.filename.replace(/[^\p{L}\p{N}._-]/gu, '_').slice(0, 120)
      const key = `schools/${schoolId}/lesson-records/${user.userId}/${id}-${safeName}`
      const url = await uploadFile(key, file.buffer, file.contentType)
      return { name: file.filename, url, key, contentType: file.contentType, size: file.buffer.length }
    }))

    const record = await createLessonRecordService({
      schoolId,
      teacherId: user.userId,
      classId: parsed.data.classId,
      subjectId: parsed.data.subjectId,
      timetableSlotId: parsed.data.timetableSlotId,
      date: parsed.data.date,
      title: parsed.data.title,
      topic: parsed.data.topic,
      description: parsed.data.description || null,
      attachments,
    })
    if (!record) return reply.status(500).send({ message: 'Não foi possível criar o registro.' })
    await logAudit({ userId: user.userId, userRole: user.role, schoolId }, 'CREATE', 'lessonRecord', record.id)
    return reply.status(201).send(record)
  })

  app.put('/lesson-records/:id', { preHandler: teacherAccess }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const fields: Record<string, string> = {}
    const files: Array<{ filename: string; contentType: string; buffer: Buffer }> = []
    for await (const part of request.parts({ limits: { files: 5, fileSize: 10 * 1024 * 1024, fields: 8 } })) {
      if (part.type === 'file') {
        if (!allowedContentTypes.has(part.mimetype)) {
          await part.toBuffer()
          return reply.status(400).send({ message: `Formato não permitido: ${part.filename}` })
        }
        files.push({ filename: part.filename, contentType: part.mimetype, buffer: await part.toBuffer() })
      } else if (typeof part.value === 'string') {
        fields[part.fieldname] = part.value
      }
    }

    const parsed = updateLessonRecordSchema.safeParse(fields)
    if (!parsed.success) return reply.status(400).send({ message: 'Dados do registro inválidos', issues: parsed.error.flatten() })
    const user = request.user as TenantPayload
    const schoolId = getSchoolId(request)
    let existing
    try {
      existing = await getLessonRecordService(schoolId, id, user.userId)
    } catch (error) {
      if (error instanceof Error && error.message === 'Lesson record not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
    if (existing.attachments.length + files.length > 5) {
      return reply.status(400).send({ message: 'O registro pode ter no máximo 5 anexos.' })
    }

    try {
      await validateLessonAssignmentService(
        schoolId,
        user.userId,
        parsed.data.classId,
        parsed.data.subjectId,
        parsed.data.timetableSlotId ?? existing.timetableSlotId ?? undefined,
        parsed.data.date,
      )
    } catch {
      return reply.status(403).send({ message: 'A turma ou disciplina não está vinculada a este professor.' })
    }

    const newAttachments = await Promise.all(files.map(async (file) => {
      const attachmentId = randomUUID()
      const safeName = file.filename.replace(/[^\p{L}\p{N}._-]/gu, '_').slice(0, 120)
      const key = `schools/${schoolId}/lesson-records/${user.userId}/${attachmentId}-${safeName}`
      const url = await uploadFile(key, file.buffer, file.contentType)
      return { name: file.filename, url, key, contentType: file.contentType, size: file.buffer.length }
    }))

    const record = await updateLessonRecordService(schoolId, id, user.userId, {
      classId: parsed.data.classId,
      subjectId: parsed.data.subjectId,
      timetableSlotId: parsed.data.timetableSlotId ?? existing.timetableSlotId,
      date: parsed.data.date,
      title: parsed.data.title,
      topic: parsed.data.topic,
      description: parsed.data.description || null,
      attachments: [...existing.attachments, ...newAttachments],
    })
    if (!record) return reply.status(404).send({ message: 'Lesson record not found' })
    await logAudit({ userId: user.userId, userRole: user.role, schoolId }, 'UPDATE', 'lessonRecord', id)
    return reply.send(record)
  })

  app.delete('/lesson-records/:id', { preHandler: teacherAccess }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const user = request.user as TenantPayload
    const schoolId = getSchoolId(request)
    try {
      const record = await deleteLessonRecordService(schoolId, id, user.userId)
      if (!record) return reply.status(404).send({ message: 'Lesson record not found' })
      await Promise.all(record.attachments.map((attachment) => deleteFile(attachment.key).catch(() => null)))
      await logAudit({ userId: user.userId, userRole: user.role, schoolId }, 'DELETE', 'lessonRecord', id)
      return reply.status(204).send()
    } catch (error) {
      if (error instanceof Error && error.message === 'Lesson record not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })
}

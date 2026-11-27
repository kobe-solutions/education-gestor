import { randomUUID } from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middlewares/auth'
import { injectTenant } from '../../middlewares/tenant'
import { authorizeRoles, type TenantPayload } from '../../middlewares/authorize'
import { getSchoolId } from '../../lib/routeHelpers'
import { errorHandler, handleRouteError, successHandler } from '../../lib/responseHandlers'
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
    try {
      const summary = await getLessonRecordSummaryService(getSchoolId(request), month)
      return successHandler(reply, 'Resumo das aulas carregado com sucesso.', 200, summary)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível carregar o resumo das aulas.')
    }
  })

  app.get('/lesson-records', { preHandler: readAccess }, async (request, reply) => {
    try {
      const query = listLessonRecordsQuerySchema.parse(request.query)
      const user = request.user as TenantPayload
      const records = await listLessonRecordsService(getSchoolId(request), {
        ...query,
        ...(user.role === 'professor' ? { ownTeacherId: user.userId } : {}),
      })
      return successHandler(reply, 'Registros de aula carregados com sucesso.', 200, records)
    } catch (error) {
      return handleRouteError(reply, error, 'Os filtros dos registros de aula são inválidos.')
    }
  })

  app.get('/lesson-records/:id', { preHandler: readAccess }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const user = request.user as TenantPayload
    try {
      const record = await getLessonRecordService(getSchoolId(request), id, user.role === 'professor' ? user.userId : undefined)
      return successHandler(reply, 'Registro de aula carregado com sucesso.', 200, record)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível carregar o registro de aula.', [
        { message: 'Lesson record not found', status: 404 },
      ])
    }
  })

  app.post('/lesson-records', { preHandler: teacherAccess }, async (request, reply) => {
    try {
    const fields: Record<string, string> = {}
    const files: Array<{ filename: string; contentType: string; buffer: Buffer }> = []
    for await (const part of request.parts({ limits: { files: 5, fileSize: 10 * 1024 * 1024, fields: 8 } })) {
      if (part.type === 'file') {
        if (!allowedContentTypes.has(part.mimetype)) {
          await part.toBuffer()
          return errorHandler(reply, `Formato não permitido: ${part.filename}`, 400)
        }
        files.push({ filename: part.filename, contentType: part.mimetype, buffer: await part.toBuffer() })
      } else if (typeof part.value === 'string') {
        fields[part.fieldname] = part.value
      }
    }

    const parsed = createLessonRecordSchema.safeParse(fields)
    if (!parsed.success) return errorHandler(reply, 'Dados do registro inválidos. Confira os campos e tente novamente.', 400)
    const user = request.user as TenantPayload
    const schoolId = getSchoolId(request)
    try {
      await validateLessonAssignmentService(schoolId, user.userId, parsed.data.classId, parsed.data.subjectId, parsed.data.timetableSlotId, parsed.data.date)
    } catch {
      return errorHandler(reply, 'A turma ou disciplina não está vinculada a este professor.', 403)
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
    if (!record) return errorHandler(reply, 'Não foi possível criar o registro.', 500)
    await logAudit({ userId: user.userId, userRole: user.role, schoolId }, 'CREATE', 'lessonRecord', record.id)
    return successHandler(reply, 'Registro de aula criado com sucesso.', 201, record)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível criar o registro de aula. Confira os dados e tente novamente.')
    }
  })

  app.put('/lesson-records/:id', { preHandler: teacherAccess }, async (request, reply) => {
    try {
    const { id } = request.params as { id: string }
    const fields: Record<string, string> = {}
    const files: Array<{ filename: string; contentType: string; buffer: Buffer }> = []
    for await (const part of request.parts({ limits: { files: 5, fileSize: 10 * 1024 * 1024, fields: 8 } })) {
      if (part.type === 'file') {
        if (!allowedContentTypes.has(part.mimetype)) {
          await part.toBuffer()
          return errorHandler(reply, `Formato não permitido: ${part.filename}`, 400)
        }
        files.push({ filename: part.filename, contentType: part.mimetype, buffer: await part.toBuffer() })
      } else if (typeof part.value === 'string') {
        fields[part.fieldname] = part.value
      }
    }

    const parsed = updateLessonRecordSchema.safeParse(fields)
    if (!parsed.success) return errorHandler(reply, 'Dados do registro inválidos. Confira os campos e tente novamente.', 400)
    const user = request.user as TenantPayload
    const schoolId = getSchoolId(request)
    let existing
    try {
      existing = await getLessonRecordService(schoolId, id, user.userId)
    } catch (error) {
      if (error instanceof Error && error.message === 'Lesson record not found') {
        return errorHandler(reply, 'O registro de aula informado não foi encontrado.', 404)
      }
      throw error
    }
    if (existing.attachments.length + files.length > 5) {
      return errorHandler(reply, 'O registro pode ter no máximo 5 anexos.', 400)
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
      return errorHandler(reply, 'A turma ou disciplina não está vinculada a este professor.', 403)
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
    if (!record) return errorHandler(reply, 'O registro de aula informado não foi encontrado.', 404)
    await logAudit({ userId: user.userId, userRole: user.role, schoolId }, 'UPDATE', 'lessonRecord', id)
    return successHandler(reply, 'Registro de aula atualizado com sucesso.', 200, record)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível atualizar o registro de aula. Confira os dados e tente novamente.')
    }
  })

  app.delete('/lesson-records/:id', { preHandler: teacherAccess }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const user = request.user as TenantPayload
    const schoolId = getSchoolId(request)
    try {
      const record = await deleteLessonRecordService(schoolId, id, user.userId)
      if (!record) return errorHandler(reply, 'O registro de aula informado não foi encontrado.', 404)
      await Promise.all(record.attachments.map((attachment) => deleteFile(attachment.key).catch(() => null)))
      await logAudit({ userId: user.userId, userRole: user.role, schoolId }, 'DELETE', 'lessonRecord', id)
      return successHandler(reply, 'Registro de aula excluído com sucesso.', 200, null)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível excluir o registro de aula.', [
        { message: 'Lesson record not found', status: 404 },
      ])
    }
  })
}

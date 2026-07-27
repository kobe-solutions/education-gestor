import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middlewares/auth'
import { injectTenant } from '../../middlewares/tenant'
import { authorizeRoles, type TenantPayload } from '../../middlewares/authorize'
import { getSchoolId } from '../../lib/routeHelpers'
import { extFromMime, validateImageFile } from '../../lib/validators'
import { logAudit } from '../../lib/audit'
import { createTeacherBodySchema, updateTeacherBodySchema, changePasswordBodySchema } from './teachers.schema'
import {
  createTeacherService,
  listTeachersService,
  getTeacherService,
  updateTeacherService,
  deleteTeacherService,
  changeTeacherPasswordService,
  uploadTeacherPhotoService,
  addTeacherSubjectService,
  removeTeacherSubjectService,
  listTeacherDocumentsService,
  uploadTeacherDocumentService,
  deleteTeacherDocumentService,
} from './teachers.service'

const readPreHandler = [authenticate, injectTenant, authorizeRoles(['admin', 'secretaria', 'gestor', 'professor'])]
const writePreHandler = [authenticate, injectTenant, authorizeRoles(['admin', 'secretaria', 'gestor'])]

export async function teachersRoutes(app: FastifyInstance) {
  // ── Self-service (professor) ──────────────────────────────────────────────────

  app.post('/teachers/:id/photo', { preHandler: writePreHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const data = await request.file()
      if (!data) return reply.status(400).send({ message: 'Nenhum arquivo enviado' })

      const buffer = await data.toBuffer()
      const validation = validateImageFile(data.mimetype, buffer.length)
      if (!validation.valid) return reply.status(400).send({ message: validation.message })

      return reply.send(await uploadTeacherPhotoService(
        getSchoolId(request), id, buffer, data.mimetype, extFromMime(data.mimetype),
      ))
    } catch (error) {
      if (error instanceof Error && error.message === 'Teacher not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })

  app.put('/teachers/me', { preHandler: readPreHandler }, async (request, reply) => {
    try {
      const teacherId = (request.user as TenantPayload).userId
      const body = updateTeacherBodySchema.parse(request.body)
      return reply.send(await updateTeacherService(getSchoolId(request), teacherId, body))
    } catch (error) {
      if (error instanceof Error && error.message === 'Teacher not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })

  app.put('/teachers/me/password', { preHandler: readPreHandler }, async (request, reply) => {
    try {
      const teacherId = (request.user as TenantPayload).userId
      const body = changePasswordBodySchema.parse(request.body)
      await changeTeacherPasswordService(getSchoolId(request), teacherId, body.password)
      return reply.status(204).send()
    } catch (error) {
      if (error instanceof Error && error.message === 'Teacher not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })

  app.post('/teachers/me/photo', { preHandler: readPreHandler }, async (request, reply) => {
    try {
      const teacherId = (request.user as TenantPayload).userId
      const data = await request.file()
      if (!data) return reply.status(400).send({ message: 'Nenhum arquivo enviado' })

      const buffer = await data.toBuffer()
      const validation = validateImageFile(data.mimetype, buffer.length)
      if (!validation.valid) return reply.status(400).send({ message: validation.message })

      return reply.send(await uploadTeacherPhotoService(
        getSchoolId(request), teacherId, buffer, data.mimetype, extFromMime(data.mimetype),
      ))
    } catch (error) {
      if (error instanceof Error && error.message === 'Teacher not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })

  app.get('/teachers', { preHandler: readPreHandler }, async (request, reply) => {
    const { page = '1', limit = '50' } = request.query as { page?: string; limit?: string }
    const limitN = Math.min(parseInt(limit, 10) || 50, 200)
    const offset = (parseInt(page, 10) - 1 || 0) * limitN
    return reply.send(await listTeachersService(getSchoolId(request), { limit: limitN, offset }))
  })

  app.get('/teachers/:id', { preHandler: readPreHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      return reply.send(await getTeacherService(getSchoolId(request), id))
    } catch (error) {
      if (error instanceof Error && error.message === 'Teacher not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })

  app.post('/teachers', { preHandler: writePreHandler }, async (request, reply) => {
    try {
      const body = createTeacherBodySchema.parse(request.body)
      const user = request.user as TenantPayload
      const teacher = await createTeacherService(getSchoolId(request), body, { role: user.role, secretariaId: (user as Record<string, unknown>).secretariaId as string | undefined })
      await logAudit({ userId: user.userId, userRole: user.role, schoolId: getSchoolId(request) }, 'CREATE', 'teacher', teacher.id)
      return reply.status(201).send(teacher)
    } catch (error) {
      if (error instanceof Error && error.message === 'Teacher already exists with this email') {
        return reply.status(409).send({ message: error.message })
      }
      if (error instanceof Error && error.message === 'Secretaria não possui escolas vinculadas') {
        return reply.status(403).send({ message: error.message })
      }
      throw error
    }
  })

  app.put('/teachers/:id', { preHandler: writePreHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const body = updateTeacherBodySchema.parse(request.body)
      const result = await updateTeacherService(getSchoolId(request), id, body)
      const user = request.user as TenantPayload
      await logAudit({ userId: user.userId, userRole: user.role, schoolId: getSchoolId(request) }, 'UPDATE', 'teacher', id)
      return reply.send(result)
    } catch (error) {
      if (error instanceof Error && error.message === 'Teacher not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })

  app.delete('/teachers/:id', { preHandler: writePreHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      await deleteTeacherService(getSchoolId(request), id)
      const user = request.user as TenantPayload
      await logAudit({ userId: user.userId, userRole: user.role, schoolId: getSchoolId(request) }, 'DELETE', 'teacher', id)
      return reply.status(204).send()
    } catch (error) {
      if (error instanceof Error && error.message === 'Teacher not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })

  app.put('/teachers/:id/password', { preHandler: writePreHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const body = changePasswordBodySchema.parse(request.body)
      await changeTeacherPasswordService(getSchoolId(request), id, body.password)
      return reply.status(204).send()
    } catch (error) {
      if (error instanceof Error && error.message === 'Teacher not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })

  app.post('/teachers/:id/subjects', { preHandler: writePreHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const { subjectId } = request.body as { subjectId: string }
      if (!subjectId) return reply.status(400).send({ message: 'subjectId is required' })
      const result = await addTeacherSubjectService(getSchoolId(request), id, subjectId)
      return reply.status(201).send(result)
    } catch (error) {
      if (error instanceof Error && error.message === 'Teacher not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })

  app.delete('/teachers/:id/subjects/:subjectId', { preHandler: writePreHandler }, async (request, reply) => {
    try {
      const { id, subjectId } = request.params as { id: string; subjectId: string }
      await removeTeacherSubjectService(getSchoolId(request), id, subjectId)
      return reply.status(204).send()
    } catch (error) {
      if (error instanceof Error && error.message === 'Teacher not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })

  // ─── Documentos do Professor ────────────────────────────────────────────────

  const DOC_ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']

  app.get('/teachers/:id/documents', { preHandler: writePreHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      return reply.send(await listTeacherDocumentsService(getSchoolId(request), id))
    } catch (error) {
      if (error instanceof Error && error.message === 'Teacher not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })

  app.post('/teachers/:id/documents', { preHandler: writePreHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const { type = 'outros' } = request.query as { type?: string }

      const data = await request.file()
      if (!data) return reply.status(400).send({ message: 'Nenhum arquivo enviado' })
      if (!DOC_ALLOWED_TYPES.includes(data.mimetype))
        return reply.status(400).send({ message: 'Formato inválido. Use PDF, JPEG ou PNG.' })

      const buffer = await data.toBuffer()
      if (buffer.length > 10 * 1024 * 1024)
        return reply.status(400).send({ message: 'Arquivo muito grande. Máximo 10MB.' })

      const doc = await uploadTeacherDocumentService(
        getSchoolId(request), id, buffer, data.filename, type, data.mimetype, buffer.length, extFromMime(data.mimetype),
      )
      return reply.status(201).send(doc)
    } catch (error) {
      if (error instanceof Error && error.message === 'Teacher not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })

  app.delete('/teachers/:id/documents/:docId', { preHandler: writePreHandler }, async (request, reply) => {
    try {
      const { id, docId } = request.params as { id: string; docId: string }
      await deleteTeacherDocumentService(getSchoolId(request), id, docId)
      return reply.status(204).send()
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Teacher not found' || error.message === 'Document not found') {
          return reply.status(404).send({ message: error.message })
        }
      }
      throw error
    }
  })
}

import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middlewares/auth'
import { injectTenant } from '../../middlewares/tenant'
import { authorizeRoles } from '../../middlewares/authorize'
import { getSchoolId } from '../../lib/routeHelpers'
import { extFromMime, validateImageFile, validateDocumentFile } from '../../lib/validators'
import {
  createStudentBodySchema,
  updateStudentBodySchema,
  upsertMedicalBodySchema,
  createGuardianBodySchema,
  updateGuardianBodySchema,
} from './students.schema'
import {
  listStudentsService,
  getStudentService,
  createStudentService,
  updateStudentService,
  deleteStudentService,
  uploadStudentPhotoService,
  listGuardiansService,
  addGuardianService,
  updateGuardianService,
  deleteGuardianService,
  getMedicalService,
  upsertMedicalService,
  listDocumentsService,
  uploadDocumentService,
  deleteDocumentService,
} from './students.service'
import { logAudit } from '../../lib/audit'
import type { TenantPayload } from '../../middlewares/authorize'

const preHandler = [authenticate, injectTenant, authorizeRoles(['admin', 'secretaria', 'gestor'])]

export async function studentsRoutes(app: FastifyInstance) {
  app.get('/students', { preHandler }, async (request, reply) => {
    const { page = '1', limit = '50' } = request.query as { page?: string; limit?: string }
    const limitN = Math.min(parseInt(limit, 10) || 50, 200)
    const offset = (parseInt(page, 10) - 1 || 0) * limitN
    return reply.send(await listStudentsService(getSchoolId(request), { limit: limitN, offset }))
  })

  app.get('/students/:id', { preHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      return reply.send(await getStudentService(getSchoolId(request), id))
    } catch (e) {
      if (e instanceof Error && e.message === 'Student not found') return reply.status(404).send({ message: e.message })
      throw e
    }
  })

  app.post('/students', { preHandler }, async (request, reply) => {
    try {
      const body = createStudentBodySchema.parse(request.body)
      const user = request.user as TenantPayload
      const student = await createStudentService(getSchoolId(request), body, { role: user.role, secretariaId: (user as Record<string, unknown>).secretariaId as string | undefined })
      await logAudit({ userId: user.userId, userRole: user.role, schoolId: getSchoolId(request) }, 'CREATE', 'student', student.id)
      return reply.status(201).send(student)
    } catch (e) {
      if (e instanceof Error && e.message === 'Enrollment code already in use') {
        return reply.status(409).send({ message: e.message })
      }
      if (e instanceof Error && e.message === 'Secretaria não possui escolas vinculadas') {
        return reply.status(403).send({ message: e.message })
      }
      throw e
    }
  })

  app.put('/students/:id', { preHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const body = updateStudentBodySchema.parse(request.body)
      const result = await updateStudentService(getSchoolId(request), id, body)
      const user = request.user as TenantPayload
      await logAudit({ userId: user.userId, userRole: user.role, schoolId: getSchoolId(request) }, 'UPDATE', 'student', id)
      return reply.send(result)
    } catch (e) {
      if (e instanceof Error) {
        if (e.message === 'Student not found') return reply.status(404).send({ message: e.message })
        if (e.message === 'Enrollment code already in use') return reply.status(409).send({ message: e.message })
      }
      throw e
    }
  })

  app.delete('/students/:id', { preHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      await deleteStudentService(getSchoolId(request), id)
      const user = request.user as TenantPayload
      await logAudit({ userId: user.userId, userRole: user.role, schoolId: getSchoolId(request) }, 'DELETE', 'student', id)
      return reply.status(204).send()
    } catch (e) {
      if (e instanceof Error && e.message === 'Student not found') return reply.status(404).send({ message: e.message })
      throw e
    }
  })

  // ── Foto ─────────────────────────────────────────────────────────────────────

  app.post('/students/:id/photo', { preHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const data = await request.file()
      if (!data) return reply.status(400).send({ message: 'Nenhum arquivo enviado' })

      const buffer = await data.toBuffer()
      const validation = validateImageFile(data.mimetype, buffer.length)
      if (!validation.valid) return reply.status(400).send({ message: validation.message })

      return reply.send(await uploadStudentPhotoService(
        getSchoolId(request), id, buffer, data.mimetype, extFromMime(data.mimetype),
      ))
    } catch (e) {
      if (e instanceof Error && e.message === 'Student not found') return reply.status(404).send({ message: e.message })
      throw e
    }
  })

  // ── Responsáveis / autorizados ───────────────────────────────────────────────

  app.get('/students/:id/guardians', { preHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      return reply.send(await listGuardiansService(getSchoolId(request), id))
    } catch (e) {
      if (e instanceof Error && e.message === 'Student not found') return reply.status(404).send({ message: e.message })
      throw e
    }
  })

  app.post('/students/:id/guardians', { preHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const body = createGuardianBodySchema.parse(request.body)
      return reply.status(201).send(await addGuardianService(getSchoolId(request), id, body))
    } catch (e) {
      if (e instanceof Error && e.message === 'Student not found') return reply.status(404).send({ message: e.message })
      throw e
    }
  })

  app.put('/students/:id/guardians/:guardianId', { preHandler }, async (request, reply) => {
    try {
      const { id, guardianId } = request.params as { id: string; guardianId: string }
      const body = updateGuardianBodySchema.parse(request.body)
      return reply.send(await updateGuardianService(getSchoolId(request), id, guardianId, body))
    } catch (e) {
      if (e instanceof Error) {
        if (e.message === 'Student not found' || e.message === 'Guardian not found') {
          return reply.status(404).send({ message: e.message })
        }
      }
      throw e
    }
  })

  app.delete('/students/:id/guardians/:guardianId', { preHandler }, async (request, reply) => {
    try {
      const { id, guardianId } = request.params as { id: string; guardianId: string }
      await deleteGuardianService(getSchoolId(request), id, guardianId)
      return reply.status(204).send()
    } catch (e) {
      if (e instanceof Error && e.message === 'Student not found') return reply.status(404).send({ message: e.message })
      throw e
    }
  })

  // ── Ficha médica ─────────────────────────────────────────────────────────────

  app.get('/students/:id/medical', { preHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      return reply.send(await getMedicalService(getSchoolId(request), id) ?? {})
    } catch (e) {
      if (e instanceof Error && e.message === 'Student not found') return reply.status(404).send({ message: e.message })
      throw e
    }
  })

  app.put('/students/:id/medical', { preHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const body = upsertMedicalBodySchema.parse(request.body)
      return reply.send(await upsertMedicalService(getSchoolId(request), id, body))
    } catch (e) {
      if (e instanceof Error && e.message === 'Student not found') return reply.status(404).send({ message: e.message })
      throw e
    }
  })

  // ── Documentos ───────────────────────────────────────────────────────────────

  app.get('/students/:id/documents', { preHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      return reply.send(await listDocumentsService(getSchoolId(request), id))
    } catch (e) {
      if (e instanceof Error && e.message === 'Student not found') return reply.status(404).send({ message: e.message })
      throw e
    }
  })

  app.post('/students/:id/documents', { preHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const { type = 'outros' } = request.query as { type?: string }

      const data = await request.file()
      if (!data) return reply.status(400).send({ message: 'Nenhum arquivo enviado' })

      const buffer = await data.toBuffer()
      const validation = validateDocumentFile(data.mimetype, buffer.length)
      if (!validation.valid) return reply.status(400).send({ message: validation.message })

      const doc = await uploadDocumentService(
        getSchoolId(request), id, buffer, data.filename, type, data.mimetype, buffer.length, extFromMime(data.mimetype),
      )
      return reply.status(201).send(doc)
    } catch (e) {
      if (e instanceof Error && e.message === 'Student not found') return reply.status(404).send({ message: e.message })
      throw e
    }
  })

  app.delete('/students/:id/documents/:docId', { preHandler }, async (request, reply) => {
    try {
      const { id, docId } = request.params as { id: string; docId: string }
      await deleteDocumentService(getSchoolId(request), id, docId)
      return reply.status(204).send()
    } catch (e) {
      if (e instanceof Error) {
        if (e.message === 'Student not found' || e.message === 'Document not found') {
          return reply.status(404).send({ message: e.message })
        }
      }
      throw e
    }
  })
}

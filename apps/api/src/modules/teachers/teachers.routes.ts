import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middlewares/auth'
import { injectTenant } from '../../middlewares/tenant'
import { authorizeRoles, type TenantPayload } from '../../middlewares/authorize'
import { getSchoolId } from '../../lib/routeHelpers'
import { extFromMime, validateImageFile } from '../../lib/validators'
import { logAudit } from '../../lib/audit'
import { createTeacherBodySchema, updateTeacherBodySchema, changePasswordBodySchema } from './teachers.schema'
import { errorHandler, handleRouteError, successHandler } from '../../lib/responseHandlers'
import {
  createTeacherService,
  listTeachersService,
  getTeacherService,
  updateTeacherService,
  deleteTeacherService,
  permanentDeleteTeacherService,
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
const adminOnly = [authenticate, injectTenant, authorizeRoles(['admin'])]

export async function teachersRoutes(app: FastifyInstance) {
  // ── Self-service (professor) ──────────────────────────────────────────────────

  app.post('/teachers/:id/photo', { preHandler: writePreHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const data = await request.file()
      if (!data) return errorHandler(reply, 'Nenhum arquivo enviado.', 400)

      const buffer = await data.toBuffer()
      const validation = validateImageFile(data.mimetype, buffer.length)
      if (!validation.valid) return errorHandler(reply, validation.message, 400)

      const photo = await uploadTeacherPhotoService(
        getSchoolId(request), id, buffer, data.mimetype, extFromMime(data.mimetype),
      )
      return successHandler(reply, 'Foto do professor atualizada com sucesso.', 200, photo)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível atualizar a foto do professor.', [
        { message: 'Teacher not found', status: 404 },
      ])
    }
  })

  app.put('/teachers/me', { preHandler: readPreHandler }, async (request, reply) => {
    try {
      const teacherId = (request.user as TenantPayload).userId
      const body = updateTeacherBodySchema.parse(request.body)
      const teacher = await updateTeacherService(getSchoolId(request), teacherId, body)
      return successHandler(reply, 'Perfil do professor atualizado com sucesso.', 200, teacher)
    } catch (error) {
      return handleRouteError(reply, error, 'Os dados do perfil são inválidos.', [
        { message: 'Teacher not found', status: 404 },
      ])
    }
  })

  app.put('/teachers/me/password', { preHandler: readPreHandler }, async (request, reply) => {
    try {
      const teacherId = (request.user as TenantPayload).userId
      const body = changePasswordBodySchema.parse(request.body)
      await changeTeacherPasswordService(getSchoolId(request), teacherId, body.password)
      return successHandler(reply, 'Senha do professor atualizada com sucesso.', 200, null)
    } catch (error) {
      return handleRouteError(reply, error, 'A senha informada é inválida.', [
        { message: 'Teacher not found', status: 404 },
      ])
    }
  })

  app.post('/teachers/me/photo', { preHandler: readPreHandler }, async (request, reply) => {
    try {
      const teacherId = (request.user as TenantPayload).userId
      const data = await request.file()
      if (!data) return errorHandler(reply, 'Nenhum arquivo enviado.', 400)

      const buffer = await data.toBuffer()
      const validation = validateImageFile(data.mimetype, buffer.length)
      if (!validation.valid) return errorHandler(reply, validation.message, 400)

      const photo = await uploadTeacherPhotoService(
        getSchoolId(request), teacherId, buffer, data.mimetype, extFromMime(data.mimetype),
      )
      return successHandler(reply, 'Foto do professor atualizada com sucesso.', 200, photo)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível atualizar a foto do professor.', [
        { message: 'Teacher not found', status: 404 },
      ])
    }
  })

  app.get('/teachers', { preHandler: readPreHandler }, async (request, reply) => {
    const { page = '1', limit = '50' } = request.query as { page?: string; limit?: string }
    const limitN = Math.min(parseInt(limit, 10) || 50, 200)
    const offset = (parseInt(page, 10) - 1 || 0) * limitN
    try {
      const teachers = await listTeachersService(getSchoolId(request), { limit: limitN, offset })
      return successHandler(reply, 'Professores carregados com sucesso.', 200, teachers)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível carregar os professores.')
    }
  })

  app.get('/teachers/:id', { preHandler: readPreHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const teacher = await getTeacherService(getSchoolId(request), id)
      return successHandler(reply, 'Professor carregado com sucesso.', 200, teacher)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível carregar o professor.', [
        { message: 'Teacher not found', status: 404 },
      ])
    }
  })

  app.post('/teachers', { preHandler: writePreHandler }, async (request, reply) => {
    try {
      const body = createTeacherBodySchema.parse(request.body)
      const user = request.user as TenantPayload
      const teacher = await createTeacherService(getSchoolId(request), body, { role: user.role, secretariaId: (user as Record<string, unknown>).secretariaId as string | undefined })
      await logAudit({ userId: user.userId, userRole: user.role, schoolId: getSchoolId(request) }, 'CREATE', 'teacher', teacher.id)
      return successHandler(reply, 'Professor cadastrado com sucesso.', 201, teacher)
    } catch (error) {
      return handleRouteError(reply, error, 'Os dados do professor são inválidos.', [
        { message: 'Já existe um professor cadastrado com este e-mail', status: 409 },
        { message: 'Secretaria não possui escolas vinculadas', status: 403 },
      ])
    }
  })

  app.put('/teachers/:id', { preHandler: writePreHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const body = updateTeacherBodySchema.parse(request.body)
      const result = await updateTeacherService(getSchoolId(request), id, body)
      const user = request.user as TenantPayload
      await logAudit({ userId: user.userId, userRole: user.role, schoolId: getSchoolId(request) }, 'UPDATE', 'teacher', id)
      return successHandler(reply, 'Professor atualizado com sucesso.', 200, result)
    } catch (error) {
      return handleRouteError(reply, error, 'Os dados do professor são inválidos.', [
        { message: 'Teacher not found', status: 404 },
      ])
    }
  })

  app.delete('/teachers/:id', { preHandler: writePreHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      await deleteTeacherService(getSchoolId(request), id)
      const user = request.user as TenantPayload
      await logAudit({ userId: user.userId, userRole: user.role, schoolId: getSchoolId(request) }, 'DELETE', 'teacher', id)
      return successHandler(reply, 'Professor removido com sucesso.', 200, null)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível remover o professor.', [
        { message: 'Teacher not found', status: 404 },
      ])
    }
  })

  app.delete('/teachers/:id/permanent', { preHandler: adminOnly }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      await permanentDeleteTeacherService(getSchoolId(request), id)
      const user = request.user as TenantPayload
      await logAudit({ userId: user.userId, userRole: user.role, schoolId: getSchoolId(request) }, 'DELETE', 'teacher', id, { permanent: true })
      return successHandler(reply, 'Professor removido permanentemente com sucesso.', 200, null)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível remover permanentemente o professor.', [
        { message: 'Teacher not found', status: 404 },
      ])
    }
  })

  app.put('/teachers/:id/password', { preHandler: writePreHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const body = changePasswordBodySchema.parse(request.body)
      await changeTeacherPasswordService(getSchoolId(request), id, body.password)
      return successHandler(reply, 'Senha do professor atualizada com sucesso.', 200, null)
    } catch (error) {
      return handleRouteError(reply, error, 'A senha informada é inválida.', [
        { message: 'Teacher not found', status: 404 },
      ])
    }
  })

  app.post('/teachers/:id/subjects', { preHandler: writePreHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const { subjectId } = request.body as { subjectId: string }
      if (!subjectId) return errorHandler(reply, 'A disciplina é obrigatória.', 400)
      const result = await addTeacherSubjectService(getSchoolId(request), id, subjectId)
      return successHandler(reply, 'Disciplina vinculada ao professor com sucesso.', 201, result)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível vincular a disciplina ao professor.', [
        { message: 'Teacher not found', status: 404 },
      ])
    }
  })

  app.delete('/teachers/:id/subjects/:subjectId', { preHandler: writePreHandler }, async (request, reply) => {
    try {
      const { id, subjectId } = request.params as { id: string; subjectId: string }
      await removeTeacherSubjectService(getSchoolId(request), id, subjectId)
      return successHandler(reply, 'Disciplina desvinculada do professor com sucesso.', 200, null)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível desvincular a disciplina do professor.', [
        { message: 'Teacher not found', status: 404 },
      ])
    }
  })

  // ─── Documentos do Professor ────────────────────────────────────────────────

  const DOC_ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']

  app.get('/teachers/:id/documents', { preHandler: writePreHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const documents = await listTeacherDocumentsService(getSchoolId(request), id)
      return successHandler(reply, 'Documentos do professor carregados com sucesso.', 200, documents)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível carregar os documentos do professor.', [
        { message: 'Teacher not found', status: 404 },
      ])
    }
  })

  app.post('/teachers/:id/documents', { preHandler: writePreHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const { type = 'outros' } = request.query as { type?: string }

      const data = await request.file()
      if (!data) return errorHandler(reply, 'Nenhum arquivo enviado.', 400)
      if (!DOC_ALLOWED_TYPES.includes(data.mimetype))
        return errorHandler(reply, 'Formato inválido. Use PDF, JPEG ou PNG.', 400)

      const buffer = await data.toBuffer()
      if (buffer.length > 10 * 1024 * 1024)
        return errorHandler(reply, 'Arquivo muito grande. O limite é 10 MB.', 400)

      const doc = await uploadTeacherDocumentService(
        getSchoolId(request), id, buffer, data.filename, type, data.mimetype, buffer.length, extFromMime(data.mimetype),
      )
      return successHandler(reply, 'Documento do professor enviado com sucesso.', 201, doc)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível enviar o documento do professor.', [
        { message: 'Teacher not found', status: 404 },
      ])
    }
  })

  app.delete('/teachers/:id/documents/:docId', { preHandler: writePreHandler }, async (request, reply) => {
    try {
      const { id, docId } = request.params as { id: string; docId: string }
      await deleteTeacherDocumentService(getSchoolId(request), id, docId)
      return successHandler(reply, 'Documento do professor removido com sucesso.', 200, null)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível remover o documento do professor.', [
        { message: 'Teacher not found', status: 404 },
        { message: 'Document not found', status: 404, responseMessage: 'O documento informado não foi encontrado.' },
      ])
    }
  })
}

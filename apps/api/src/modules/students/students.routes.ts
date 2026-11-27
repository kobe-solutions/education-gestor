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
  permanentDeleteStudentService,
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
import { importStudentsService } from './import-students.service'
import { errorHandler, handleRouteError, successHandler } from '../../lib/responseHandlers'

const preHandler = [authenticate, injectTenant, authorizeRoles(['admin', 'secretaria', 'gestor'])]
const adminOnly = [authenticate, injectTenant, authorizeRoles(['admin'])]

export async function studentsRoutes(app: FastifyInstance) {
  app.get('/students', { preHandler }, async (request, reply) => {
    const { page = '1', limit = '50', search, status, sex, minAge, maxAge } = request.query as {
      page?: string; limit?: string; search?: string; status?: string; sex?: string; minAge?: string; maxAge?: string
    }
    const limitN = Math.min(parseInt(limit, 10) || 50, 200)
    const offset = (parseInt(page, 10) - 1 || 0) * limitN
    try {
      const students = await listStudentsService(getSchoolId(request), {
      limit: limitN,
      offset,
      ...(search ? { search } : {}),
      ...(status ? { status } : {}),
      ...(sex ? { sex } : {}),
      ...(minAge ? { minAge: parseInt(minAge, 10) } : {}),
      ...(maxAge ? { maxAge: parseInt(maxAge, 10) } : {}),
      })
      return successHandler(reply, 'Alunos carregados com sucesso.', 200, students)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível carregar os alunos.')
    }
  })

  app.get('/students/:id', { preHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const student = await getStudentService(getSchoolId(request), id)
      return successHandler(reply, 'Aluno carregado com sucesso.', 200, student)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível carregar o aluno.', [
        { message: 'Student not found', status: 404 },
      ])
    }
  })

  app.post('/students', { preHandler }, async (request, reply) => {
    try {
      const body = createStudentBodySchema.parse(request.body)
      const user = request.user as TenantPayload
      const student = await createStudentService(getSchoolId(request), body, { role: user.role, secretariaId: (user as Record<string, unknown>).secretariaId as string | undefined })
      await logAudit({ userId: user.userId, userRole: user.role, schoolId: getSchoolId(request) }, 'CREATE', 'student', student.id)
      return successHandler(reply, 'Aluno cadastrado com sucesso.', 201, student)
    } catch (error) {
      return handleRouteError(reply, error, 'Os dados do aluno são inválidos. Insira os dados corretamente', [
        { message: 'Enrollment code already in use', status: 409, responseMessage: 'Este código de matrícula já está em uso.' },
        { message: 'Secretaria não possui escolas vinculadas', status: 403 },
      ])
    }
  })

  // ── Importação em lote ──────────────────────────────────────────────────────

  app.post('/students/import', { preHandler }, async (request, reply) => {
    try {
      const data = await request.file()
      if (!data) return errorHandler(reply, 'Nenhum arquivo enviado.', 400)

      const buffer = await data.toBuffer()
      const MAX_IMPORT_SIZE = 10 * 1024 * 1024
      if (buffer.length > MAX_IMPORT_SIZE) {
        return errorHandler(reply, 'Arquivo muito grande. O limite é 10 MB.', 400)
      }

      const fileName = data.filename
      const ext = fileName.toLowerCase().split('.').pop()
      if (ext !== 'csv' && ext !== 'xlsx' && ext !== 'xls') {
        return errorHandler(reply, 'Formato inválido. Use CSV ou XLSX.', 400)
      }

      const user = request.user as TenantPayload
      const schoolId = getSchoolId(request)
      const result = await importStudentsService(
        schoolId,
        buffer,
        fileName,
        { userId: user.userId, userRole: user.role, schoolId },
      )
      return successHandler(reply, 'Importação de alunos concluída.', 200, result)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível importar os alunos.', [
        { message: 'Formato', status: 400, includes: true },
      ])
    }
  })

  app.put('/students/:id', { preHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const body = updateStudentBodySchema.parse(request.body)
      const result = await updateStudentService(getSchoolId(request), id, body)
      const user = request.user as TenantPayload
      await logAudit({ userId: user.userId, userRole: user.role, schoolId: getSchoolId(request) }, 'UPDATE', 'student', id)
      return successHandler(reply, 'Aluno atualizado com sucesso.', 200, result)
    } catch (error) {
      return handleRouteError(reply, error, 'Os dados do aluno são inválidos.', [
        { message: 'Student not found', status: 404 },
        { message: 'Enrollment code already in use', status: 409, responseMessage: 'Este código de matrícula já está em uso.' },
      ])
    }
  })

  app.delete('/students/:id', { preHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      await deleteStudentService(getSchoolId(request), id)
      const user = request.user as TenantPayload
      await logAudit({ userId: user.userId, userRole: user.role, schoolId: getSchoolId(request) }, 'DELETE', 'student', id)
      return successHandler(reply, 'Aluno removido com sucesso.', 200, null)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível remover o aluno.', [
        { message: 'Student not found', status: 404 },
      ])
    }
  })

  app.delete('/students/:id/permanent', { preHandler: adminOnly }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      await permanentDeleteStudentService(getSchoolId(request), id)
      const user = request.user as TenantPayload
      await logAudit({ userId: user.userId, userRole: user.role, schoolId: getSchoolId(request) }, 'DELETE', 'student', id, { permanent: true })
      return successHandler(reply, 'Aluno removido permanentemente com sucesso.', 200, null)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível remover permanentemente o aluno.', [
        { message: 'Student not found', status: 404 },
      ])
    }
  })

  // ── Foto ─────────────────────────────────────────────────────────────────────

  app.post('/students/:id/photo', { preHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const data = await request.file()
      if (!data) return errorHandler(reply, 'Nenhum arquivo enviado.', 400)

      const buffer = await data.toBuffer()
      const validation = validateImageFile(data.mimetype, buffer.length)
      if (!validation.valid) return errorHandler(reply, validation.message, 400)

      const photo = await uploadStudentPhotoService(
        getSchoolId(request), id, buffer, data.mimetype, extFromMime(data.mimetype),
      )
      return successHandler(reply, 'Foto do aluno atualizada com sucesso.', 200, photo)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível atualizar a foto do aluno.', [
        { message: 'Student not found', status: 404 },
      ])
    }
  })

  // ── Responsáveis / autorizados ───────────────────────────────────────────────

  app.get('/students/:id/guardians', { preHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const guardians = await listGuardiansService(getSchoolId(request), id)
      return successHandler(reply, 'Responsáveis do aluno carregados com sucesso.', 200, guardians)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível carregar os responsáveis do aluno.', [
        { message: 'Student not found', status: 404 },
      ])
    }
  })

  app.post('/students/:id/guardians', { preHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const body = createGuardianBodySchema.parse(request.body)
      const guardian = await addGuardianService(getSchoolId(request), id, body)
      return successHandler(reply, 'Responsável cadastrado com sucesso.', 201, guardian)
    } catch (error) {
      return handleRouteError(reply, error, 'Os dados do responsável são inválidos.', [
        { message: 'Student not found', status: 404 },
      ])
    }
  })

  app.put('/students/:id/guardians/:guardianId', { preHandler }, async (request, reply) => {
    try {
      const { id, guardianId } = request.params as { id: string; guardianId: string }
      const body = updateGuardianBodySchema.parse(request.body)
      const guardian = await updateGuardianService(getSchoolId(request), id, guardianId, body)
      return successHandler(reply, 'Responsável atualizado com sucesso.', 200, guardian)
    } catch (error) {
      return handleRouteError(reply, error, 'Os dados do responsável são inválidos.', [
        { message: 'Student not found', status: 404 },
        { message: 'Guardian not found', status: 404, responseMessage: 'O responsável informado não foi encontrado.' },
      ])
    }
  })

  app.delete('/students/:id/guardians/:guardianId', { preHandler }, async (request, reply) => {
    try {
      const { id, guardianId } = request.params as { id: string; guardianId: string }
      await deleteGuardianService(getSchoolId(request), id, guardianId)
      return successHandler(reply, 'Responsável removido com sucesso.', 200, null)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível remover o responsável.', [
        { message: 'Student not found', status: 404 },
        { message: 'Guardian not found', status: 404 },
      ])
    }
  })

  // ── Ficha médica ─────────────────────────────────────────────────────────────

  app.get('/students/:id/medical', { preHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const medical = await getMedicalService(getSchoolId(request), id)
      return successHandler(reply, 'Ficha médica carregada com sucesso.', 200, medical ?? {})
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível carregar a ficha médica.', [
        { message: 'Student not found', status: 404 },
      ])
    }
  })

  app.put('/students/:id/medical', { preHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const body = upsertMedicalBodySchema.parse(request.body)
      const medical = await upsertMedicalService(getSchoolId(request), id, body)
      return successHandler(reply, 'Ficha médica atualizada com sucesso.', 200, medical)
    } catch (error) {
      return handleRouteError(reply, error, 'Os dados da ficha médica são inválidos.', [
        { message: 'Student not found', status: 404 },
      ])
    }
  })

  // ── Documentos ───────────────────────────────────────────────────────────────

  app.get('/students/:id/documents', { preHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const documents = await listDocumentsService(getSchoolId(request), id)
      return successHandler(reply, 'Documentos do aluno carregados com sucesso.', 200, documents)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível carregar os documentos do aluno.', [
        { message: 'Student not found', status: 404 },
      ])
    }
  })

  app.post('/students/:id/documents', { preHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const { type = 'outros' } = request.query as { type?: string }

      const data = await request.file()
      if (!data) return errorHandler(reply, 'Nenhum arquivo enviado.', 400)

      const buffer = await data.toBuffer()
      const validation = validateDocumentFile(data.mimetype, buffer.length)
      if (!validation.valid) return errorHandler(reply, validation.message, 400)

      const doc = await uploadDocumentService(
        getSchoolId(request), id, buffer, data.filename, type, data.mimetype, buffer.length, extFromMime(data.mimetype),
      )
      return successHandler(reply, 'Documento enviado com sucesso.', 201, doc)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível enviar o documento.', [
        { message: 'Student not found', status: 404 },
      ])
    }
  })

  app.delete('/students/:id/documents/:docId', { preHandler }, async (request, reply) => {
    try {
      const { id, docId } = request.params as { id: string; docId: string }
      await deleteDocumentService(getSchoolId(request), id, docId)
      return successHandler(reply, 'Documento removido com sucesso.', 200, null)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível remover o documento.', [
        { message: 'Student not found', status: 404 },
        { message: 'Document not found', status: 404, responseMessage: 'O documento informado não foi encontrado.' },
      ])
    }
  })
}

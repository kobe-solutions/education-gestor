import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middlewares/auth'
import { injectTenant } from '../../middlewares/tenant'
import { authorizeRoles } from '../../middlewares/authorize'
import { getSchoolId } from '../../lib/routeHelpers'
import { errorHandler, handleRouteError, successHandler } from '../../lib/responseHandlers'
import { validateDocumentFile, extFromMime } from '../../lib/validators'
import { createTuitionBodySchema, updateTuitionBodySchema } from './financial.schema'
import {
  listTuitionsService,
  listStudentTuitionsService,
  createTuitionService,
  updateTuitionService,
  registerPaymentService,
  uploadTuitionBoletoService,
  uploadTuitionReceiptService,
} from './financial.service'
import { logAudit } from '../../lib/audit'
import type { TenantPayload } from '../../middlewares/authorize'

const preHandler = [authenticate, injectTenant, authorizeRoles(['admin', 'secretaria', 'gestor'])]

export async function financialRoutes(app: FastifyInstance) {
  app.get('/tuitions', { preHandler }, async (request, reply) => {
    const { page = '1', limit = '100', status } = request.query as { page?: string; limit?: string; status?: string }
    const limitN = Math.min(parseInt(limit, 10) || 100, 200)
    const offset = (parseInt(page, 10) - 1 || 0) * limitN
    try {
      const tuitions = await listTuitionsService(getSchoolId(request), { limit: limitN, offset, ...(status ? { status } : {}) })
      return successHandler(reply, 'Mensalidades carregadas com sucesso.', 200, tuitions)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível carregar as mensalidades.')
    }
  })

  app.get('/students/:id/tuitions', { preHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const tuitions = await listStudentTuitionsService(getSchoolId(request), id)
      return successHandler(reply, 'Mensalidades do aluno carregadas com sucesso.', 200, tuitions)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível carregar as mensalidades do aluno.', [
        { message: 'Student not found', status: 404, responseMessage: 'O aluno informado não foi encontrado.' },
      ])
    }
  })

  app.post('/tuitions', { preHandler }, async (request, reply) => {
    try {
      const body = createTuitionBodySchema.parse(request.body)
      const tuition = await createTuitionService({ schoolId: getSchoolId(request), ...body })
      const user = request.user as TenantPayload
      await logAudit({ userId: user.userId, userRole: user.role, schoolId: getSchoolId(request) }, 'CREATE', 'tuition', tuition.id)
      return successHandler(reply, 'Mensalidade criada com sucesso.', 201, tuition)
    } catch (error) {
      return handleRouteError(reply, error, 'Os dados da mensalidade são inválidos.', [
        { message: 'Student not found', status: 404, responseMessage: 'O aluno informado não foi encontrado.' },
      ])
    }
  })

  app.patch('/tuitions/:id', { preHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const body = updateTuitionBodySchema.parse(request.body)
      const tuition = await updateTuitionService(getSchoolId(request), id, body)
      return successHandler(reply, 'Mensalidade atualizada com sucesso.', 200, tuition)
    } catch (error) {
      return handleRouteError(reply, error, 'Os dados da mensalidade são inválidos.', [
        { message: 'Tuition not found', status: 404 },
        { message: 'Cannot update a paid tuition', status: 409, responseMessage: 'Não é possível atualizar uma mensalidade já paga.' },
      ])
    }
  })

  app.patch('/tuitions/:id/pay', { preHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const result = await registerPaymentService(getSchoolId(request), id)
      const user = request.user as TenantPayload
      await logAudit({ userId: user.userId, userRole: user.role, schoolId: getSchoolId(request) }, 'PAY', 'tuition', id)
      return successHandler(reply, 'Pagamento registrado com sucesso.', 200, result)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível registrar o pagamento.', [
        { message: 'Tuition not found', status: 404 },
        { message: 'Tuition already paid', status: 409, responseMessage: 'Esta mensalidade já está paga.' },
      ])
    }
  })

  app.post('/tuitions/:id/boleto', { preHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const data = await request.file()
      if (!data) return errorHandler(reply, 'Nenhum arquivo enviado.', 400)

      const buffer = await data.toBuffer()
      const validation = validateDocumentFile(data.mimetype, buffer.length)
      if (!validation.valid) return errorHandler(reply, validation.message, 400)

      const result = await uploadTuitionBoletoService(
        getSchoolId(request), id, buffer, data.mimetype, extFromMime(data.mimetype),
      )
      return successHandler(reply, 'Boleto anexado com sucesso.', 200, result)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível anexar o boleto.', [
        { message: 'Tuition not found', status: 404 },
      ])
    }
  })

  app.post('/tuitions/:id/receipt', { preHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const data = await request.file()
      if (!data) return errorHandler(reply, 'Nenhum arquivo enviado.', 400)

      const buffer = await data.toBuffer()
      const validation = validateDocumentFile(data.mimetype, buffer.length)
      if (!validation.valid) return errorHandler(reply, validation.message, 400)

      const result = await uploadTuitionReceiptService(
        getSchoolId(request), id, buffer, data.mimetype, extFromMime(data.mimetype),
      )
      return successHandler(reply, 'Comprovante anexado com sucesso.', 200, result)
    } catch (error) {
      return handleRouteError(reply, error, 'Não foi possível anexar o comprovante.', [
        { message: 'Tuition not found', status: 404 },
      ])
    }
  })
}

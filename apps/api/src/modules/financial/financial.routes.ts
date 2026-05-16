import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middlewares/auth'
import { injectTenant } from '../../middlewares/tenant'
import { authorizeRoles } from '../../middlewares/authorize'
import { getSchoolId } from '../../lib/routeHelpers'
import { createTuitionBodySchema, updateTuitionBodySchema } from './financial.schema'
import {
  listTuitionsService,
  listStudentTuitionsService,
  createTuitionService,
  updateTuitionService,
  registerPaymentService,
} from './financial.service'
import { logAudit } from '../../lib/audit'
import type { TenantPayload } from '../../middlewares/authorize'

const preHandler = [authenticate, injectTenant, authorizeRoles(['admin', 'secretaria', 'gestor'])]

export async function financialRoutes(app: FastifyInstance) {
  app.get('/tuitions', { preHandler }, async (request, reply) => {
    const { page = '1', limit = '100' } = request.query as { page?: string; limit?: string }
    const limitN = Math.min(parseInt(limit, 10) || 100, 200)
    const offset = (parseInt(page, 10) - 1 || 0) * limitN
    return reply.send(await listTuitionsService(getSchoolId(request), { limit: limitN, offset }))
  })

  app.get('/students/:id/tuitions', { preHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      return reply.send(await listStudentTuitionsService(getSchoolId(request), id))
    } catch (error) {
      if (error instanceof Error && error.message === 'Student not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })

  app.post('/tuitions', { preHandler }, async (request, reply) => {
    try {
      const body = createTuitionBodySchema.parse(request.body)
      const tuition = await createTuitionService({ schoolId: getSchoolId(request), ...body })
      return reply.status(201).send(tuition)
    } catch (error) {
      if (error instanceof Error && error.message === 'Student not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })

  app.patch('/tuitions/:id', { preHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const body = updateTuitionBodySchema.parse(request.body)
      return reply.send(await updateTuitionService(getSchoolId(request), id, body))
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Tuition not found') return reply.status(404).send({ message: error.message })
        if (error.message === 'Cannot update a paid tuition') return reply.status(409).send({ message: error.message })
      }
      throw error
    }
  })

  app.patch('/tuitions/:id/pay', { preHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const result = await registerPaymentService(getSchoolId(request), id)
      const user = request.user as TenantPayload
      await logAudit({ userId: user.userId, userRole: user.role, schoolId: getSchoolId(request) }, 'PAY', 'tuition', id)
      return reply.send(result)
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Tuition not found') return reply.status(404).send({ message: error.message })
        if (error.message === 'Tuition already paid') return reply.status(409).send({ message: error.message })
      }
      throw error
    }
  })
}

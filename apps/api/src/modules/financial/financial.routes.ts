import type { FastifyInstance } from 'fastify'
import { ZodError } from 'zod'
import { authenticate } from '../../middlewares/auth'
import { injectTenant } from '../../middlewares/tenant'
import { authorizeRoles } from '../../middlewares/authorize'
import type { TenantPayload } from '../../middlewares/authorize'
import { createTuitionBodySchema } from './financial.schema'
import {
  listTuitionsService,
  listStudentTuitionsService,
  createTuitionService,
  registerPaymentService,
} from './financial.service'

const preHandler = [authenticate, injectTenant, authorizeRoles(['admin', 'secretaria', 'gestor'])]

function getSchoolId(request: { user: unknown }): string {
  const payload = request.user as TenantPayload
  return payload.schoolId
}

export async function financialRoutes(app: FastifyInstance) {
  app.get('/tuitions', { preHandler }, async (request, reply) => {
    const schoolId = getSchoolId(request)
    return reply.send(await listTuitionsService(schoolId))
  })

  app.get('/students/:id/tuitions', { preHandler }, async (request, reply) => {
    try {
      const schoolId = getSchoolId(request)
      const { id } = request.params as { id: string }
      return reply.send(await listStudentTuitionsService(schoolId, id))
    } catch (error) {
      if (error instanceof Error && error.message === 'Student not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })

  app.post('/tuitions', { preHandler }, async (request, reply) => {
    try {
      const schoolId = getSchoolId(request)
      const body = createTuitionBodySchema.parse(request.body)
      const tuition = await createTuitionService({ schoolId, ...body })
      return reply.status(201).send(tuition)
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(400).send({ message: 'Validation error', issues: error.issues })
      }
      if (error instanceof Error && error.message === 'Student not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })

  app.patch('/tuitions/:id/pay', { preHandler }, async (request, reply) => {
    try {
      const schoolId = getSchoolId(request)
      const { id } = request.params as { id: string }
      const tuition = await registerPaymentService(schoolId, id)
      return reply.send(tuition)
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Tuition not found') return reply.status(404).send({ message: error.message })
        if (error.message === 'Tuition already paid') return reply.status(409).send({ message: error.message })
      }
      throw error
    }
  })
}

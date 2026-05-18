import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middlewares/auth'
import { injectTenant } from '../../middlewares/tenant'
import { authorizeRoles } from '../../middlewares/authorize'
import { getSchoolId } from '../../lib/routeHelpers'
import { createClassPeriodBodySchema, updateClassPeriodBodySchema } from './classPeriods.schema'
import {
  listClassPeriodsService,
  getClassPeriodService,
  createClassPeriodService,
  updateClassPeriodService,
  deleteClassPeriodService,
} from './classPeriods.service'

const writeHandler = [authenticate, injectTenant, authorizeRoles(['admin', 'secretaria', 'gestor'])]
const readHandler = [authenticate, injectTenant]

export async function classPeriodsRoutes(app: FastifyInstance) {
  app.get('/class-periods', { preHandler: readHandler }, async (request, reply) => {
    return reply.send(await listClassPeriodsService(getSchoolId(request)))
  })

  app.get('/class-periods/:id', { preHandler: readHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      return reply.send(await getClassPeriodService(getSchoolId(request), id))
    } catch (error) {
      if (error instanceof Error && error.message === 'Class period not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })

  app.post('/class-periods', { preHandler: writeHandler }, async (request, reply) => {
    const body = createClassPeriodBodySchema.parse(request.body)
    const period = await createClassPeriodService(getSchoolId(request), body)
    return reply.status(201).send(period)
  })

  app.put('/class-periods/:id', { preHandler: writeHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const body = updateClassPeriodBodySchema.parse(request.body)
      return reply.send(await updateClassPeriodService(getSchoolId(request), id, body))
    } catch (error) {
      if (error instanceof Error && error.message === 'Class period not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })

  app.delete('/class-periods/:id', { preHandler: writeHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      await deleteClassPeriodService(getSchoolId(request), id)
      return reply.status(204).send()
    } catch (error) {
      if (error instanceof Error && error.message === 'Class period not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })
}

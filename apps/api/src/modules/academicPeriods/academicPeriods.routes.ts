import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middlewares/auth'
import { injectTenant } from '../../middlewares/tenant'
import { authorizeRoles } from '../../middlewares/authorize'
import { getSchoolId } from '../../lib/routeHelpers'
import { createAcademicPeriodBodySchema, updateAcademicPeriodBodySchema } from './academicPeriods.schema'
import {
  listAcademicPeriodsService,
  getAcademicPeriodService,
  createAcademicPeriodService,
  updateAcademicPeriodService,
  deleteAcademicPeriodService,
} from './academicPeriods.service'

const preHandler = [authenticate, injectTenant, authorizeRoles(['admin', 'secretaria', 'gestor'])]

export async function academicPeriodsRoutes(app: FastifyInstance) {
  app.get('/academic-periods', { preHandler }, async (request, reply) => {
    return reply.send(await listAcademicPeriodsService(getSchoolId(request)))
  })

  app.get('/academic-periods/:id', { preHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      return reply.send(await getAcademicPeriodService(getSchoolId(request), id))
    } catch (error) {
      if (error instanceof Error && error.message === 'Academic period not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })

  app.post('/academic-periods', { preHandler }, async (request, reply) => {
    const body = createAcademicPeriodBodySchema.parse(request.body)
    const period = await createAcademicPeriodService({ schoolId: getSchoolId(request), ...body })
    return reply.status(201).send(period)
  })

  app.put('/academic-periods/:id', { preHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const body = updateAcademicPeriodBodySchema.parse(request.body)
      return reply.send(await updateAcademicPeriodService(getSchoolId(request), id, body))
    } catch (error) {
      if (error instanceof Error && error.message === 'Academic period not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })

  app.delete('/academic-periods/:id', { preHandler }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      await deleteAcademicPeriodService(getSchoolId(request), id)
      return reply.status(204).send()
    } catch (error) {
      if (error instanceof Error && error.message === 'Academic period not found') {
        return reply.status(404).send({ message: error.message })
      }
      throw error
    }
  })
}

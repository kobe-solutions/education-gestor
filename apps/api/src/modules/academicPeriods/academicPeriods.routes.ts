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

const writeHandler = [authenticate, injectTenant, authorizeRoles(['admin', 'secretaria', 'gestor'])]
const readHandler = [authenticate, injectTenant]

export async function academicPeriodsRoutes(app: FastifyInstance) {
  app.get(
    '/academic-years/:yearId/periods',
    { preHandler: readHandler },
    async (request, reply) => {
      const { yearId } = request.params as { yearId: string }
      return reply.send(await listAcademicPeriodsService(getSchoolId(request), yearId))
    },
  )

  app.get(
    '/academic-years/:yearId/periods/:id',
    { preHandler: readHandler },
    async (request, reply) => {
      try {
        const { yearId, id } = request.params as { yearId: string; id: string }
        return reply.send(await getAcademicPeriodService(getSchoolId(request), yearId, id))
      } catch (error) {
        if (error instanceof Error && error.message === 'Academic period not found') {
          return reply.status(404).send({ message: error.message })
        }
        throw error
      }
    },
  )

  app.post(
    '/academic-years/:yearId/periods',
    { preHandler: writeHandler },
    async (request, reply) => {
      const { yearId } = request.params as { yearId: string }
      const body = createAcademicPeriodBodySchema.parse(request.body)
      const period = await createAcademicPeriodService(getSchoolId(request), yearId, body)
      return reply.status(201).send(period)
    },
  )

  app.put(
    '/academic-years/:yearId/periods/:id',
    { preHandler: writeHandler },
    async (request, reply) => {
      try {
        const { yearId, id } = request.params as { yearId: string; id: string }
        const body = updateAcademicPeriodBodySchema.parse(request.body)
        return reply.send(await updateAcademicPeriodService(getSchoolId(request), yearId, id, body))
      } catch (error) {
        if (error instanceof Error && error.message === 'Academic period not found') {
          return reply.status(404).send({ message: error.message })
        }
        throw error
      }
    },
  )

  app.delete(
    '/academic-years/:yearId/periods/:id',
    { preHandler: writeHandler },
    async (request, reply) => {
      try {
        const { yearId, id } = request.params as { yearId: string; id: string }
        await deleteAcademicPeriodService(getSchoolId(request), yearId, id)
        return reply.status(204).send()
      } catch (error) {
        if (error instanceof Error && error.message === 'Academic period not found') {
          return reply.status(404).send({ message: error.message })
        }
        throw error
      }
    },
  )
}
